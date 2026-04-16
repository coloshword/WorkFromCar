data "aws_ami" "amazon_linux" {
  most_recent = true
  owners = ["amazon"]

  filter {
    name = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_key_pair" "deployer" {
  key_name = "${var.project_name}-deployer"
  public_key = file("~/.ssh/id_rsa.pub")
}

resource "aws_instance" "server" {
  ami = data.aws_ami.amazon_linux.id
  instance_type = "t3.small"
  key_name = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -euxo pipefail

    dnf update -y
    dnf install -y docker tar gzip libcap
    systemctl enable --now docker
    usermod -aG docker ec2-user

    CADDY_VERSION="2.11.2"
    ARCH="$(uname -m)"

    if [ "$ARCH" = "x86_64" ]; then
      CADDY_ARCH="amd64"
    elif [ "$ARCH" = "aarch64" ]; then
      CADDY_ARCH="arm64"
    else
      echo "Unsupported architecture: $ARCH"
      exit 1
    fi

    curl -fL -o /tmp/caddy.tar.gz "https://github.com/caddyserver/caddy/releases/download/v$${CADDY_VERSION}/caddy_$${CADDY_VERSION}_linux_$${CADDY_ARCH}.tar.gz"
    tar -xzf /tmp/caddy.tar.gz -C /tmp
    install -m 755 /tmp/caddy /usr/local/bin/caddy
    /usr/sbin/setcap cap_net_bind_service=+ep /usr/local/bin/caddy

    groupadd --system caddy || true
    useradd --system \
      --gid caddy \
      --create-home \
      --home-dir /var/lib/caddy \
      --shell /usr/sbin/nologin \
      --comment "Caddy web server" \
      caddy || true

    mkdir -p /etc/caddy /var/lib/caddy /var/log/caddy
    chown -R caddy:caddy /etc/caddy /var/lib/caddy /var/log/caddy

    cat >/etc/caddy/Caddyfile <<CADDYFILE
    ${var.api_domain} {
      encode gzip zstd
      reverse_proxy 127.0.0.1:3000
    }
    CADDYFILE

    cat >/etc/systemd/system/caddy.service <<'SERVICE'
    [Unit]
    Description=Caddy
    Documentation=https://caddyserver.com/docs/
    After=network-online.target
    Wants=network-online.target

    [Service]
    User=caddy
    Group=caddy
    ExecStart=/usr/local/bin/caddy run --environ --config /etc/caddy/Caddyfile
    ExecReload=/usr/local/bin/caddy reload --config /etc/caddy/Caddyfile --force
    TimeoutStopSec=5s
    LimitNOFILE=1048576
    LimitNPROC=512
    PrivateTmp=true
    ProtectSystem=full
    AmbientCapabilities=CAP_NET_BIND_SERVICE

    [Install]
    WantedBy=multi-user.target
    SERVICE

    systemctl daemon-reload
    systemctl enable --now caddy
  EOF

  tags = {
    Name = "${var.project_name}-server"
    Project = var.project_name
  }
}
