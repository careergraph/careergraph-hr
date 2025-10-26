import api from "@/config/axiosConfig";

const lookup = async (query: string) => {
  try {
    if (!query || query.trim().length === 0) {
      return { data: [] };
    }

    const response = await api.get("/skills/lookup", {
      params: { query },
    });
    return response.data;
  } catch (error) {
    console.log("Error when fetching skill", error);
    throw error;
  }
};

export { lookup };
