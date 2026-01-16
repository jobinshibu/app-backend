import database from '../models/index.js';
import { dataParse } from '../utils/utils.js';
import { Op } from 'sequelize';

class CommonService {
  async create(modelName, data) {
    try {
      const model = database[modelName];
      const response = await model.create(data);
      return dataParse(response);
    } catch (e) {
      console.log('error', e);
    }
  }
  
  async bulkCreate(modelName, data) {
    try {
      const model = database[modelName];
      const response = await model.bulkCreate(data, { returning: true, individualHooks: true });
      return dataParse(response);
    } catch (e) {
      console.log('error', e);
    }
  }
  async update(modelName, id, data) {
    try {
      const model = database[modelName];
      const response = await model.update(data, {
        where: {
          id: id
        },
        individualHooks: true
      });
      return dataParse(response);
    } catch (error) {
      console.log('error', error);
    }
  }
  async updateByCondition(modelName, whereClause, data) {
    try {
      const model = database[modelName];
      const response = await model.update(data, { where: whereClause, individualHooks: true });
      return dataParse(response);
    } catch (error) {
      console.log('error', error);
    }
  }
  async getSingleRecord(modelName, id) {
    try {
      const model = database[modelName];
      const response = await model.findOne({
        where: {
          id: id
        }
      });
      return dataParse(response);
    } catch (e) {
      console.log('error', e);
    }
  }
async getSingleRecordByCondition(modelName, whereClause, include = []) {
  try {
    const model = database[modelName];
    const response = await model.findOne({
      where: whereClause,
      include: include
    });
    return dataParse(response);
  } catch (e) {
    console.log('error', e);
  }
}
  async getMultipleRecords(modelName, id) {
    try {
      const model = database[modelName];
      const response = await model.findAll({
        where: {
          id: id
        }
      });
      return dataParse(response);
    } catch (e) {
      console.log('error', e);
    }
  }
  async getMultipleRecordsByCondition(modelName, whereClause) {
    try {
      const model = database[modelName];
      const response = await model.findAll({
        where: whereClause
      });
      return dataParse(response);
    } catch (e) {
      console.log('error', e);
    }
  }
  async deleteById(modelName, id) {
    try {
      const model = database[modelName];
      const response = await model.destroy({
        where: {
          id: id
        }
      });
      return dataParse(response);
    } catch (e) {
      console.log('error', e);
    }
  }
  async getCountByConditions(modelName, whereClause) {
    try {
      const model = database[modelName];
      const response = await model.count({
        where: whereClause
      });
      return dataParse(response);
    } catch (e) {
      console.log('error', e);
    }
  }
  async deleteByCondition(modelName, whereClause) {
    try {
      const model = database[modelName];
      const response = await model.destroy({
        where: whereClause
      });
      return dataParse(response);
    } catch (e) {
      console.log('error', e);
    }
  }
}
export default new CommonService();
