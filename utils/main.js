const fs = require("fs");
const httpStatus = require("http-status");
const path = require("path");
const moment = require("moment");
const exec = require("child_process").exec;

const ApiError = require("./ApiError");
const db = require("./../models");
const constants = require("../constants");
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

const asyncForEachWriteFiles = async (teams) => {
  try {
    let files = await File.findAll({
      include: [{ model: Team }],
    });

    files = files.map((item) => {
      return item.get({ plain: true });
    });

    for (let i = 0; i < files.length; i++) {
      const folder = files[i].Team.team;
      const directoryPath = path.join(
        __dirname.split("utils").join("repos"),
        `${folder}/score/task3/round1/${files[i].name
          .split("sgm")
          .join("score")}`
      );

      const texts = [];
      texts.push(`BLEU ${files[i].BLEU}`);
      texts.push(`ChrF ${files[i].ChrF}`);

      await runCreateAndWrite(directoryPath, texts);

      // const scripts = `
      //                  git add .
      //                  git commit -a -m "commit" (do not need commit message either)
      //                  git push`;
      const scripts = `ls`;
      const aux = await runScript(scripts);
      console.log(aux);
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
    await File.destroy({
      where: {},
      truncate: true,
    });
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

const runScript = (script) => {
  return new Promise((resolve, reject) => {
    const myShellScript = exec(script);
    myShellScript.stdout.on("data", (data) => {
      console.log(data);
      resolve(data);
    });
    myShellScript.stderr.on("data", (data) => {
      console.error(data);
      resolve("");
    });
  });
};

const runCreateAndWrite = (file, texts) => {
  return new Promise((resolve) => {
    var stream = fs.createWriteStream(file);
    stream.once("open", function (fd) {
      stream.write(`${texts[0]}\n`);
      stream.write(`${texts[1]}\n`);
      stream.end();
      resolve(true);
    });
  });
};

const asyncForEachRunScript = async (files) => {
  try {
    for (let i = 0; i < files.length; i++) {
      const script = `bash /home/ubuntu/eval_competition/covid19mlia-mt-evaluation/calc_scores.sh /home/ubuntu/eval_competition/covid19mlia-mt-evaluation/tests/en-${files[i].tgt}/ref_test_en${files[i].tgt}.${files[i].tgt}.sgm ${files[i].location}`;
      console.log(script);
      const dataOk = await runScript(script);
      console.log("Ok");
      console.log(dataOk);
      const aux = dataOk.split(" ");
      if (aux.length === 6) {
        await File.update(
          {
            description: aux[3],
            BLEU: aux[4],
            ChrF: aux[5],
          },
          {
            where: {
              id: files[i].id,
            },
          }
        );
      } else {
        await File.update(
          {
            description: "",
            BLEU: "#ERROR",
            ChrF: "#ERROR",
          },
          {
            where: {
              id: files[i].id,
            },
          }
        );
      }
    }
    console.log("Finish Scripts");
    return true;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

const initTeamDb = async () => {
  try {
    // const teams = constants.teams.map((item) => {
    //   if (item.registrationDate)
    //     item.registrationDate = moment(item.registrationDate).valueOf();
    //   return item;
    // });
    // const docs = await Team.bulkCreate(teams);
    // return docs;
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
      // const files = await asyncForEachSearchFiles(teams);
      // await asyncForEachRunScript(files);

      await asyncForEachWriteFiles();
      console.log("FINISH-----");
    } catch (error) {
      console.log(error);
    }
  },
};
module.exports = Main;
