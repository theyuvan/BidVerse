import api from "./api";

export const loginUser = (loginData) => {
    return api.post("/auth/login", loginData);
};
export const SignupUser = (signupData) => {
    return api.post("/auth/register", signupData);
};
