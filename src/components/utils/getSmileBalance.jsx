import axios from "axios";

 export const GetSmileBalance = async ()=>{
  const baseURL = import.meta.env.VITE_BACKEND_URL;
          try{
                    const res = await axios.post(`${baseURL}/smile/get-smile-balance`);
                    const bal = res.data.smile_points
                    return bal 
          } catch(error){
          }
}

