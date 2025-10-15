import axios from "axios";
import { BASE_URL_LOCAL } from "../config/apiConfig";

const lookup = async (query: string) => {
  try {
    // const token = localStorage.getItem("accessToken");
    const token =
      "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIwZTEzMGI5Zi1jNWQzLTRlZDUtYjhhOS05ZDMxNzI5MTVlNWQiLCJyb2xlIjoiVVNFUiIsImlzcyI6ImNhcmVlcmdyYXBoLXN5c3RlbSIsImV4cCI6MTc2MDQ5ODg1MiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc2MDQ5NTI1MiwianRpIjoiNTkxYzNhM2EtNzBlNi00ZWU1LWIwN2YtMzg1ZGFlYjRlNTFlIiwiZW1haWwiOiJjb25ncXV5bmd1eWVuMjk2LmRldkBnbWFpbC5jb20ifQ.vVyohixsA2NNCdrJl6BwPhEDnE8F21Ea4jDDCfa5F64PuWOgBDhHFa40jn-ryzD0eEOdYgFkUrsVge0ZIrFu9Q";
    const response = await axios.get(`${BASE_URL_LOCAL}/skills/lookup`, {
      params: { query },
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    return response.data;
  } catch (error) {
    console.log("Error when fetching skill", error);
    throw error;
  }
};

export { lookup };
