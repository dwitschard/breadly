/** The shape of a recipe document as stored in MongoDB (without _id, which MongoDB adds as ObjectId). */
export interface RecipeDocument {
  name: string;
}
