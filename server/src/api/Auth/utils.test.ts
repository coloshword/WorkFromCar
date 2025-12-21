import { getJWTToken } from "./utils";

describe('getJWTToken()', () => {
  it("should return a a jwt string", () => {
    const authAccount = {
      accountId: 1,
      email: "testemail@gmail.com"
    };
    const authToken = getJWTToken(authAccount);
    expect(typeof authToken).toBe("string");
  });
  it("throws an error if accountId is not provided", () => {
    expect(() => 
      getJWTToken({email: "testemail123@gmail.com"} as any)
    ).toThrow('Missing accountId or email')
  })
})