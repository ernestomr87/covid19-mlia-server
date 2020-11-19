const nodegit = require("nodegit"),
  path = require("path"),
  fs = require("fs");

const Git = {
  clone: async (url, folderName) => {
    try {
      console.log("Url ---> " + url);
      const folder = `${__dirname}/repos`.split("utils/").join("");
      fs.mkdirSync(path.join(folder, folderName));

      var local = `${folder}/${folderName}`,
        cloneOpts = {};

      const repo = await nodegit.Clone(url, local, cloneOpts);
      console.log("Cloned " + path.basename(url) + " to " + repo.workdir());
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  },
};

module.exports = Git;
