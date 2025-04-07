import { mergeResolvers } from "@graphql-tools/merge";
import userResolver from "./user.resolver"

import { IResolvers } from "@graphql-tools/utils";

const mergedResolvers: IResolvers = mergeResolvers([userResolver])

export default mergedResolvers;