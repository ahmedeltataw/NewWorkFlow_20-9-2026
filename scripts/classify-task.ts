// // scripts/typesafe/classify-task.ts

// import { writeFileSync } from "fs";
// import dotenv from "dotenv";

// dotenv.config();

// const TYPESAFE_API_KEY = process.env.TYPESAFE_API_KEY;

// if (!TYPESAFE_API_KEY) {
//   throw new Error("Missing TYPESAFE_API_KEY");
// }

// interface ClassificationResult {
//   complexity: "simple" | "medium" | "complex";
//   risk: "low" | "medium" | "high" | "critical";
//   impact_scope: "single_file" | "feature" | "multi_feature" | "global";
//   review_level: "none" | "light" | "full";
// }

// async function classifyTask(task: string) {
//   // هنا استدعاء TypeSafe API الفعلي
//   // حسب SDK الرسمي

//   const result: ClassificationResult = {
//     complexity: "simple",
//     risk: "low",
//     impact_scope: "single_file",
//     review_level: "none",
//   };

//   return result;
// }

// async function main() {
//   const task = process.argv.slice(2).join(" ");

//   if (!task) {
//     throw new Error("Task description required");
//   }

//   const classification = await classifyTask(task);

//   writeFileSync(
//     ".ai/runtime/classification.json",
//     JSON.stringify(classification, null, 2)
//   );

//   console.log(classification);
// }

// main().catch(console.error);