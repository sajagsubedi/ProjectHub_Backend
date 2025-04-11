import { mergeResolvers } from "@graphql-tools/merge";
import userResolver from "./user.resolver";
import projectResolver from "./project.resolver";

import { IResolvers } from "@graphql-tools/utils";

const mergedResolvers: IResolvers = mergeResolvers([
  userResolver,
  projectResolver,
]);

export default mergedResolvers;
