import fs from "fs-extra";
import path from "path";

type Subjects = "F" | "E" | "AP" | "A" | "Mu" | "H" | "PE" | "M" | "S" | "ES";

// [week, LAS]
type ModuleSection = [number, number];

const COMPLETED_STUFF: Map<Subjects, ModuleSection[]> = new Map([
  [
    "F",
    [
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [6, 1],
      [7, 1],
      [1, 2],
    ],
  ],
  [
    "AP",
    [
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [6, 1],
      [7, 1],
      [8, 3],
      [1, 2],
      [1, 3],
    ],
  ],
  [
    "E",
    [
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [1, 2],
      [1, 3],
    ],
  ],
  [
    "A",
    [
      [1, 1],
      [7, 1],
    ],
  ],
  [
    "M",
    [
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [6, 1],
      [7, 1],
      [8, 1],
      [1, 2],
      [1, 3],
    ],
  ],
  [
    "PE",
    [
      [2, 1],
      [1, 2],
      [2, 2],
      [1, 1],
      [1, 3],
    ],
  ],
  [
    "H",
    [
      [1, 1],
      [3, 1],
      [4, 1],
    ],
  ],
  ["A", [[8, 2]]],
  [
    "S",
    [
      [6, 1],
      [7, 1],
      [1, 1],
      [1, 2],
      [1, 3],
    ],
  ],
  [
    "ES",
    [
      [1, 1],
      [1, 2],
      [1, 3],
    ],
  ],
  ["Mu", []],
]);

const TARGET_PATH = "E:\\Modules urg\\";

async function get_recursive_files(dir: string): Promise<string[]> {
  const files = fs.readdirSync(dir);
  const rendered = new Array<string>();
  for (const file of files) {
    const file_path = path.join(dir, file);
    if (fs.statSync(file_path).isDirectory()) {
      rendered.push(...(await get_recursive_files(file_path)));
    } else {
      rendered.push(file_path);
    }
  }
  return rendered;
}

const MOD_REGEX = /Module ([0-9])/;
const REGEX = /[a-zA-Z][a-zA-Z]* \(([^\)]*)\)$/;

const DIST = "E:\\ModulesToPrint";

async function bootstrap() {
  (await get_recursive_files(TARGET_PATH))
    .filter(p => {
      if (path.extname(p) != ".pdf") {
        return false;
      }
      let file_name = path.basename(p);
      file_name = file_name.substring(0, file_name.length - ".pdf".length);

      // remove done thing
      if (file_name.endsWith("done")) {
        file_name = file_name.substring(0, file_name.length - " done".length);
      }

      const result = file_name.match(REGEX);
      if (result == null) {
        throw `${p} is invalid module name!`;
      }
      const las = Number(result.at(1));

      // context is hard!
      const week = path.basename(path.dirname(p)).match(MOD_REGEX)?.at(1);
      if (week == null) {
        throw `${path.dirname(p)} is invalid module directory!`;
      }
      const week_num = Number(week);

      let subject_param: Subjects = undefined as unknown as Subjects;
      if (file_name.startsWith("AP")) {
        subject_param = "AP";
      } else if (file_name.startsWith("ARTS")) {
        subject_param = "A";
      } else if (file_name.startsWith("FILIPINO")) {
        subject_param = "F";
      } else if (file_name.startsWith("ENGLISH")) {
        subject_param = "E";
      } else if (file_name.startsWith("ESP")) {
        subject_param = "ES";
      } else if (file_name.startsWith("MATH")) {
        subject_param = "M";
      } else if (file_name.startsWith("PE")) {
        subject_param = "PE";
      } else if (file_name.startsWith("MUSIC")) {
        subject_param = "Mu";
      } else if (file_name.startsWith("HEALTH")) {
        subject_param = "H";
      } else if (file_name.startsWith("SCIENCE")) {
        subject_param = "S";
      }

      if (subject_param === undefined) {
        throw `Unknown subject: ${p}`;
      }

      const arr = COMPLETED_STUFF.get(subject_param);
      if (arr == undefined) {
        throw `Unknown subject (not found in our array): ${p}`;
      }

      let done = false;
      for (const [tweek, tlas] of arr) {
        if (tweek === week_num && tlas === las) {
          done = true;
        }
      }

      return !done;
    })
    .forEach(p => {
      const dir = path.basename(path.dirname(p));
      const name = path.basename(p);
      const final_dest = path.join(DIST, dir, name);
      try {
        fs.mkdirSync(DIST);
      } catch {}
      try {
        fs.mkdirSync(path.dirname(final_dest));
      } catch {}
      console.log(`Copying ${p} to ${final_dest}`);
      fs.copyFileSync(p, final_dest);
    });
}

bootstrap();
