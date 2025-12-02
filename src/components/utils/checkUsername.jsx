import axios from "axios";


export const checkUsername = async ({ userid, zoneid, product, productid }) => {
  const baseURL = import.meta.env.VITE_BACKEND_URL;


  try {
    const response = await axios.post(`${baseURL}/get-username`, {
      userid,
      zoneid,
      product,
      productid,
    });

    if (!response.data || !response.data.username) {
      return {
        success: false,
        message: "❌ User not found or invalid.",
        username: null,
      };
    }
    return {
      success: true,
      message: `✅ ${response.data.username}`,
      username: response.data.username,
      zone: response.data.region,
      raw: response.data,
    };
  } catch (error) {
    console.error("Error checking username", error);
    return {
      success: false,
      message: "⚠️ Failed to fetch username. Try again.",
      username: null,
      error,
    };
  }
};
