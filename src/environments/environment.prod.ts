// const baseApiUrl = "https://admin.svpoly.xyz/api";
const baseApiUrl = "https://admin.svpoly.breezecandles.vn/api";
const authApi = `${baseApiUrl}/auth`;

export const jwtApiUrl = `${baseApiUrl}/v1`;
const publicApiUrl = `${baseApiUrl}/public`;
export const environment = {
  production: true,
  GG_CLIENT_ID: "437095088104-c58gonumb2mu71c1d21ofn6ita2uvqr5.apps.googleusercontent.com",
  GG_CLIENT_SECRET: "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",
  // GG_CLIENT_ID: "723333154556-dbmchqand5vseqtfhskvdo121stiohqd.apps.googleusercontent.com", // tuannda3 config
  // GG_CLIENT_SECRET: "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", // tuannda3 config
  loginUrl: authApi + "/login-token",
  publicApiUrl: `${baseApiUrl}/public`,
  sponsorListUrl: `${publicApiUrl}/sponsors`,
  contestListUrl: `${publicApiUrl}/contests`,
  majorListUrl: `${publicApiUrl}/majors`,
  roundListUrl: `${publicApiUrl}/rounds`,
  sliderListUrl: `${publicApiUrl}/sliders`,
  companyListUrl: `${publicApiUrl}/company`,
  recruitment: `${publicApiUrl}/recruitments`,
  capacityListUrl: `${publicApiUrl}/capacity`,
  postListUrl: `${publicApiUrl}/posts`,

  // Router API V1
  userListUrl: `${jwtApiUrl}/users`,
  roundV1Url: `${jwtApiUrl}/round`,
  contestV1Url: `${jwtApiUrl}/contest`,
  teamListUrl: `${jwtApiUrl}/teams`,
  takeExamUrl: `${jwtApiUrl}/take-exam`,
  userV1Url: `${jwtApiUrl}/user`
};
