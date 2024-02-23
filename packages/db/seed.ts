import { db } from ".";
import { products, variants } from "./schema";

interface LS_DATA_TYPE {
  products: {
    id: number;
    name: string;
    variants: {
      id: number;
      name: string;
      price: number;
    }[];
  }[];
}
export const LS_DATA_DEV: LS_DATA_TYPE = {
  products: [
    {
      id: 173086,
      name: "Free",
      variants: [{ id: 222651, name: "Free", price: 0 }],
    },
    {
      id: 173087,
      name: "Plus",
      variants: [{ id: 222652, name: "Plus", price: 199 }],
    },
    {
      id: 173072,
      name: "Boost",
      variants: [
        {
          id: 222623,
          name: "1,500 Voters",
          price: 499,
        },
        {
          id: 222640,
          name: "2,500 Voters",
          price: 699,
        },
        {
          id: 222641,
          name: "5,000 Voters",
          price: 899,
        },
        {
          id: 222643,
          name: "7,500 Voters",
          price: 1099,
        },
        {
          id: 222644,
          name: "10,000 Voters",
          price: 1299,
        },
      ],
    },
  ],
};
export const LS_DATA_PROD: LS_DATA_TYPE = {
  products: [
    {
      id: 173116,
      name: "Free",
      variants: [{ id: 222708, name: "Free", price: 0 }],
    },
    {
      id: 173117,
      name: "Plus",
      variants: [{ id: 222709, name: "Plus", price: 199 }],
    },
    {
      id: 173113,
      name: "Boost",
      variants: [
        {
          id: 222700,
          name: "1,500 Voters",
          price: 499,
        },
        {
          id: 222701,
          name: "2,500 Voters",
          price: 699,
        },
        {
          id: 222702,
          name: "5,000 Voters",
          price: 899,
        },
        {
          id: 222703,
          name: "7,500 Voters",
          price: 1099,
        },
        {
          id: 222704,
          name: "10,000 Voters",
          price: 1299,
        },
      ],
    },
  ],
};

async function main() {
  await db.transaction(async (trx) => {
    await trx.insert(products).values(
      LS_DATA_DEV.products.map((product) => ({
        id: product.id,
        name: product.name,
      })),
    );
    await trx.insert(variants).values(
      LS_DATA_DEV.products.flatMap((product) =>
        product.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          price: variant.price,
          product_id: product.id,
        })),
      ),
    );

    console.log("Seeded products and variants");
  });
}

void main();
