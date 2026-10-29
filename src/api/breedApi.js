import axiosClient from "./axiosClient";

const breedApi = {
  getAll: (params) => axiosClient.get("/breeds", { params }),
  // vd: breedApi.getAll({ "page[number]": 1, "page[size]": 20 })
};

export default breedApi;

