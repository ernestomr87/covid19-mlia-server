"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      File.belongsTo(models.Team);
    }
  }
  File.init(
    {
      round: DataTypes.STRING,
      name: DataTypes.STRING,
      location: DataTypes.STRING,
      src: DataTypes.STRING,
      tgt: DataTypes.STRING,
      constrained: DataTypes.STRING,
      description: DataTypes.STRING,
      BLEU: DataTypes.STRING,
      ChrF: DataTypes.STRING,
      TER: DataTypes.STRING,
      BEER: DataTypes.STRING,
      remove: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "File",
    }
  );
  return File;
};
