import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

const customLocales = [
  { code: "lv-LV", name: "Latvian (Latvia)" },
];

export default async function seedLocales({ container }: ExecArgs) {
  const logger = container.resolve("logger");
  const translationModuleService = container.resolve(Modules.TRANSLATION);

  const existing = await translationModuleService.listLocales({
    code: customLocales.map((l) => l.code),
  });
  const existingCodes = new Set(existing.map((l) => l.code));

  const toCreate = customLocales.filter((l) => !existingCodes.has(l.code));

  if (!toCreate.length) {
    logger.info("Custom locales already seeded.");
    return;
  }

  await translationModuleService.createLocales(toCreate);
  logger.info(
    `Seeded custom locales: ${toCreate.map((l) => l.code).join(", ")}`
  );
}
