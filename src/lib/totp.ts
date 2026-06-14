import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from "otplib";

export const authenticator = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
  issuer: "ProofChain",
});
