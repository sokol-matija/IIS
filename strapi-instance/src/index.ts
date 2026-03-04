import type { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Enable public find/findOne for categories
    try {
      const publicRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'public' } });

      if (publicRole) {
        const permsToEnable = [
          'api::category.category.find',
          'api::category.category.findOne',
        ];
        for (const action of permsToEnable) {
          const perm = await strapi
            .query('plugin::users-permissions.permission')
            .findOne({ where: { action, role: publicRole.id } });
          if (perm && !perm.enabled) {
            await strapi
              .query('plugin::users-permissions.permission')
              .update({ where: { id: perm.id }, data: { enabled: true } });
          }
        }
        console.log('Public category permissions set');
      }
    } catch (e: any) {
      console.log('Could not set permissions:', e.message);
    }

    // Seed categories
    try {
      const count = await strapi.query('api::category.category').count();
      if (count === 0) {
        const cats = [
          { name: 'Technology', slug: 'technology', description: 'Tech news and tutorials' },
          { name: 'Food & Drink', slug: 'food-drink', description: 'Recipes and culinary guides' },
          { name: 'Travel', slug: 'travel', description: 'Travel destinations and tips' },
          { name: 'Sports', slug: 'sports', description: 'Sports news and analysis' },
          { name: 'Health', slug: 'health', description: 'Health and wellness' },
          { name: 'Education', slug: 'education', description: 'Learning resources' },
          { name: 'Science', slug: 'science', description: 'Scientific discoveries' },
          { name: 'Arts', slug: 'arts', description: 'Art, music and culture' },
        ];
        for (const cat of cats) {
          await strapi.query('api::category.category').create({ data: cat });
        }
        console.log('Seeded 8 categories');
      }
    } catch (e: any) {
      console.log('Could not seed:', e.message);
    }
  },
};
