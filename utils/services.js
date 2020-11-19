const axios = require("axios");
const { teams } = require("./../teams");
// https://www.aconvert.com/document/xls-to-json/
const Services = {
  getRepos: async () => {
    try {
      const {
        data: { values },
      } = await axios.get(
        "https://api.bitbucket.org/2.0/repositories/covid19-mlia?page=1&&pagelen=100"
      );

      const temp = [];
      values.map((item) => {
        console.log("********************");
        console.log(item.slug);
        console.log("--------");
        const exist = teams.filter((elm) => {
          let name = elm.team.toLowerCase().split("_").join("");
          return name === item.slug;
        });
        if (exist.length > 0) {
          temp.push(item);
        } else {
          teams.forEach((elm) => {
            let name = elm.team.toLowerCase().split("_").join("");
            console.log(name);
          });
        }
        console.log("********************");
      });
      return values;
    } catch (error) {
      console.log(error);
      throw new Error(error.message);
    }
  },
};

module.exports = Services;
