import { PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import { AuthPayload } from "../middleware/auth";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "iis-super-secret-key-2025";

interface GqlContext {
  token?: string;
}

function getUser(context: GqlContext): AuthPayload {
  if (!context.token) {
    throw new GraphQLError("Not authenticated", { extensions: { code: "UNAUTHENTICATED" } });
  }
  try {
    return jwt.verify(context.token, JWT_SECRET) as AuthPayload;
  } catch {
    throw new GraphQLError("Invalid token", { extensions: { code: "UNAUTHENTICATED" } });
  }
}

function requireWrite(user: AuthPayload): void {
  if (user.role !== "full-access") {
    throw new GraphQLError("Insufficient permissions", { extensions: { code: "FORBIDDEN" } });
  }
}

export const resolvers = {
  Query: {
    categories: async (_: unknown, __: unknown, context: GqlContext) => {
      getUser(context);
      return prisma.category.findMany({ orderBy: { id: "asc" } });
    },
    category: async (_: unknown, args: { id: number }, context: GqlContext) => {
      getUser(context);
      return prisma.category.findUnique({ where: { id: args.id } });
    },
  },
  Mutation: {
    createCategory: async (
      _: unknown,
      args: { input: { name: string; slug: string; description?: string } },
      context: GqlContext
    ) => {
      const user = getUser(context);
      requireWrite(user);
      return prisma.category.create({
        data: {
          name: args.input.name,
          slug: args.input.slug,
          description: args.input.description || null,
        },
      });
    },
    updateCategory: async (
      _: unknown,
      args: { id: number; input: { name?: string; slug?: string; description?: string } },
      context: GqlContext
    ) => {
      const user = getUser(context);
      requireWrite(user);
      return prisma.category.update({
        where: { id: args.id },
        data: {
          ...(args.input.name !== undefined && { name: args.input.name }),
          ...(args.input.slug !== undefined && { slug: args.input.slug }),
          ...(args.input.description !== undefined && { description: args.input.description }),
        },
      });
    },
    deleteCategory: async (_: unknown, args: { id: number }, context: GqlContext) => {
      const user = getUser(context);
      requireWrite(user);
      return prisma.category.delete({ where: { id: args.id } });
    },
  },
};
