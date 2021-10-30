const fs = require("fs");
const httpStatus = require("http-status");
const path = require("path");
// const moment = require("moment");
const exec = require("child_process").exec;

const ApiError = require("./ApiError");
const db = require("./../models");
// const constants = require("../constants");
const git = require("./git");

const Team = db.Team;
const File = db.File;

const round = 2
console.log("ROUND", round)

const roundVars = {
  1: { count: 6 },
  2: { count: 7 },
  error: {
    1: {
      description: "",
      BLEU: "#ERROR",
      ChrF: "#ERROR",
    },
    2: {
      description: "",
      BLEU: "#ERROR",
      TER: "#ERROR",
      BEER: "#ERROR",
    }
  }

}

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

const asyncForEachWriteFiles = async () => {
  try {
    let files = await File.findAll({
      where: { remove: false },
      include: [{ model: Team }],
    });

    files = files.map((item) => {
      return item.get({ plain: true });
    });

    for (let i = 0; i < files.length; i++) {
      const folder = files[i].Team.team;
      let directoryPath;
      if (round === 1) {
        directoryPath = path.join(
          __dirname.split("utils").join("repos"),
          `${folder}/score/task3/round1/${files[i].name
            .split("sgm")
            .join("score")}`
        );
        console.log("*********", directoryPath)
      } else if (round === 2) {
        directoryPath = path.join(
          __dirname.split("utils").join("repos"),
          `${folder}/score/task3/round2/${files[i].name
            .split("sgm")
            .join("score")}`
        );
        console.log("*********", directoryPath)
      }

      const texts = [];
      texts.push(`BLEU ${files[i].BLEU}`);
      texts.push(`ChrF ${files[i].ChrF}`);

      texts.push(`TER ${files[i].TER}`);
      texts.push(`BEER ${files[i].BEER}`);

      await runCreateAndWrite(directoryPath, texts);

      //bitbucket.org/covid19-mlia/sample-participant-repository.git
      const repo = files[i].Team.repo.split("https://").join("");
      const script = `bash /home/ubuntu/covid-19/covid19-mlia-server/utils/run.sh ${folder} ${repo}`;
      await runScript(script);
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
      let directoryPath;
      if (round === 1) {
        directoryPath = path.join(
          __dirname.split("utils").join("repos"),
          `${folder}/submission/task3/round1`
        );
        console.log("*********", directoryPath)
      } else if (round === 2) {
        directoryPath = path.join(
          __dirname.split("utils").join("repos"),
          `${folder}/submission/task3/round2`
        );
        console.log("*********", directoryPath)
      }




      if (fs.existsSync(directoryPath)) {
        const files = await fs.readdirSync(directoryPath);
        files.forEach(function (file) {
          const vars = file.split("_");
          let src, tgt;
          if (vars[3] && vars[3].includes("2")) {
            src = vars[3].split("2")[0];
            tgt = vars[3].split("2")[1];

            const aux = {
              round: round,
              TeamId: teams[i].id,
              name: file,
              location: `${directoryPath}/${file}`,
              src,
              tgt,
              constrained: vars[4] === "constrained",
              BLEU: "",
              ChrF: "",
              TER: "",
              BEER: "",
            };
            const flag = allFiles.filter((el) => el.name === file);
            if (!flag.length) allFiles.push(aux);
          }
        });
      }
    }
    await File.update({
      remove: true
    }, {
      where: { round: round }
    });
    let docs = await File.bulkCreate(allFiles);
    console.log("---------------------Docs", docs.length)
    docs = docs.map((doc) => {
      return doc.get({ plain: true });
    });
    return docs;
  } catch (error) {
    console.log("ERROR->", error);
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
      let script

      if (round === 1) {
        script = `bash /home/ubuntu/eval_competition/covid19mlia-mt-evaluation/calc_scores.sh /home/ubuntu/eval_competition/covid19mlia-mt-evaluation/tests/en-${files[i].tgt}/ref_test_en${files[i].tgt}.${files[i].tgt}.sgm ${files[i].location}`;
      } else if (round === 2) {
        script = `bash /home/ubuntu/eval_competition/covid19mlia-mt-evaluation/calc_scores2.sh /home/ubuntu/eval_competition/covid19mlia-mt-evaluation/tests2/test-en${files[i].tgt}-ref.${files[i].tgt}.sgm ${files[i].location}`
      }
      console.log(script)
      const dataOk = await runScript(script);
      const aux = dataOk.split(" ");
      console.log(aux)

      // const aux = ['baseline', 'en2fr', 'constrained', 'test', '0.0', '100.0', '1.7\n']
      if (aux.length === roundVars[round].count) {
        if (round === 1) {
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
        }
        if (round === 2) {
          console.log("UPDTE ROUND 2  [4,5,6]", {
            description: aux[3],
            BLEU: aux[4],
            TER: aux[5],
            BEER: aux[6],
          }, files[i].id)


          await File.update({
            description: aux[3],
            BLEU: parseFloat(aux[4]),
            TER: parseFloat(aux[5]),
            BEER: parseFloat(aux[6]),
          }, {
            where: {
              id: files[i].id, round
            }
          })
        }
      } else {
        await File.update(
          roundVars.error[round],
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
    const _teams = await Team.findAll();
    return _teams;
  } catch (error) {
    console.log(error.message);
    throw new ApiError(httpStatus[500], error.message);
  }
};

const Main = {
  initialization: async () => {
    try {
      const teams = await initTeamDb();
      await asyncForEachCloneRepos(teams);
      const files = await asyncForEachSearchFiles(teams);
      await asyncForEachRunScript(files);
      await asyncForEachWriteFiles();
      console.log("FINISH-----");
    } catch (error) {
      console.log(error);
    }
  },
};
module.exports = Main;
