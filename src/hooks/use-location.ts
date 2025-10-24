import { useState, useEffect } from "react";
import axios from "axios";
import { Province, District, Ward } from "../types/location";

const LOCATION_API_URL = "https://provinces.open-api.vn/api";

const useLocation = (provinceCode?: string, districtCode?: string) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingWards, setLoadingWards] = useState<boolean>(false);

  // Fetch danh sách Tỉnh/Thành phố
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const response = await axios.get(`${LOCATION_API_URL}/p/`);
        setProvinces(response.data);
      } catch (err) {
        console.error("Failed to fetch provinces:", err);
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  // Lấy danh sách Quận/Huyện dựa trên provinceCode
  useEffect(() => {
    if (provinceCode) {
      const fetchDistricts = async () => {
        setLoadingDistricts(true);
        setDistricts([]);
        setWards([]);
        try {
          const response = await axios.get(
            `${LOCATION_API_URL}/p/${Number(provinceCode)}?depth=2`
          );
          setDistricts(response.data.districts);
        } catch (err) {
          console.error("Failed to fetch districts:", err);
        } finally {
          setLoadingDistricts(false);
        }
      };
      fetchDistricts();
    } else {
      // Nếu không có provinceCode, reset danh sách
      setDistricts([]);
      setWards([]);
    }
  }, [provinceCode]);

  // Lấy danh sách Phường/Xã dựa trên districtCode truyền vào
  useEffect(() => {
    if (districtCode) {
      const fetchWards = async () => {
        setLoadingWards(true);
        setWards([]);
        try {
          const response = await axios.get(
            `${LOCATION_API_URL}/d/${Number(districtCode)}?depth=2`
          );
          setWards(response.data.wards);
        } catch (err) {
          console.error("Failed to fetch wards:", err);
        } finally {
          setLoadingWards(false);
        }
      };
      fetchWards();
    } else {
      // Nếu không có districtCode, reset danh sách
      setWards([]);
    }
  }, [districtCode]);
  return {
    provinces,
    districts,
    wards,
    loadingProvinces,
    loadingDistricts,
    loadingWards,
  };
};

export default useLocation;