import { ObjectId } from 'mongodb';
import { ApplicationDatabase } from '../../database/application-database';
import { Technology } from './technology.types';

export const getAllTechnologies = async () => {
  return getTechnologyCollection().find({}).toArray();
};

export const getTechnologyById = async (technologyId: string) => {
  return await getTechnologyCollection().findOne({
    _id: new ObjectId(technologyId),
  });
};

export const postTechnology = async (technology: Technology) => {
  return await getTechnologyCollection().insertOne(technology);
};

const getTechnologyCollection = () =>
  ApplicationDatabase.getCollections().TechnologyCollection;
