import { mergeTypeDefs } from "@graphql-tools/merge";

import userTypeDefs from "./user.typeDefs";
import projectTypeDefs from "./project.typeDefs";

const mergedTypeDefs = mergeTypeDefs([userTypeDefs, projectTypeDefs]);

export default mergedTypeDefs;
