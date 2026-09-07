import axios from "axios";

export const loginUser = (loginData) => {
    return axios.post("http://localhost:8080/auth/login",loginData);
};
export const SignupUser = (signupData) => {
    return axios.post("http://localhost:8080/auth/register",signupData);
};