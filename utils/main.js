const fs = require("fs");
const httpStatus = require("http-status");
const path = require("path");
const moment = require("moment");
const exec = require("child_process").exec;

const ApiError = require("./ApiError");
const db = require("./../models");
const { teams } = require("../constants");
const git = require("./git");

const Team = db.Team;
const File = db.File;

const asyncForEachCloneRepos = async (teams) => {
  try {
    const folder = `${__dirname}`.split("/utils").join("");
    await fs.promises.rmdir(`${folder}/repos`, {
      recursive: true,
    });
    console.log("remove Repos");
    fs.mkdirSync(path.join(folder, "repos"));
    console.log("create Repos");
    console.log("---------------------------");
    for (let i = 0; i < teams.length; i++) {
      const href = teams[i].repo;
      if (href) {
        const folderName = teams[i].team;
        await git.clone(href, folderName);
      }
    }
    console.log("---------------------------");
    console.log("All repositories are cloned");
    return true;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

const asyncForEachSearchFiles = async (teams) => {
  try {
    const allFiles = [];
    for (let i = 0; i < teams.length; i++) {
      const folder = teams[i].team;
      const directoryPath = path.join(
        __dirname.split("utils").join("repos"),
        `${folder}/submission/task3/round1`
      );

      if (fs.existsSync(directoryPath)) {
        const files = await fs.readdirSync(directoryPath);
        files.forEach(function (file) {
          const vars = file.split("_");
          let src, tgt;
          if (vars[3] && vars[3].includes("2")) {
            src = vars[3].split("2")[0];
            tgt = vars[3].split("2")[1];

            const aux = {
              TeamId: teams[i].id,
              name: file,
              location: `${directoryPath}/${file}`,
              src,
              tgt,
              constrained: vars[4] === "constrained",
              BLEU: "",
              ChrF: "",
            };
            console.log(file);
            allFiles.push(aux);
          }
        });
      }
    }
    console.log(allFiles);
    let docs = await File.bulkCreate(allFiles);
    docs = docs.map((doc) => {
      return doc.get({ plain: true });
    });

    return docs;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

const asyncForEachRunScript = async (files) => {
  try {
    for (let i = 0; i < files.length; i++) {
      const script = `bash /home/ubuntu/eval_competition/covid19mlia-mt-evaluation/calc_scores.sh /home/ubuntu/eval_competition/covid19mlia-mt-evaluation/tests/en-${files[i].tgt}/ref_test_en${files[i].tgt}.${files[i].tgt}.sgm ${files[i].location}`;
      console.log(script);
    }

    const myShellScript = exec(script);
    myShellScript.stdout.on("data", (data) => {
      console.log("OK");
      console.log(data);
      // do whatever you want here with data
    });
    myShellScript.stderr.on("data", (data) => {
      console.log("KO");
      console.error(data);
    });

    return true;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

const initTeamDb = async () => {
  try {
    // const teams = teams.map((item) => {
    //   if (item.registrationDate)
    //     item.registrationDate = moment(item.registrationDate).valueOf();
    //   return item;
    // });
    // await Team.bulkCreate(teams);
    // return true;
    const teams = await Team.findAll();
    return teams;
  } catch (error) {
    console.log(error.message);
    throw new ApiError(httpStatus[500], error.message);
  }
};

const Main = {
  initialization: async () => {
    try {
      const teams = await initTeamDb();
      // await asyncForEachCloneRepos(teams);
      const files = await asyncForEachSearchFiles(teams);
      await asyncForEachRunScript(files);
      console.log("FINISH-----");
    } catch (error) {
      console.log(error);
    }
  },
};
module.exports = Main;
