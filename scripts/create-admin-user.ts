import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type CliOptions = {
  email?: string;
  password?: string;
  name?: string;
  school?: string;
  force?: boolean;
  help?: boolean;
};

const prisma = new PrismaClient();

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;

    const [rawKey, valueFromEq] = arg.split("=", 2);
    const key = rawKey.slice(2);

    const consumeValue = () => {
      if (valueFromEq !== undefined) return valueFromEq;
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        i += 1;
        return next;
      }
      return undefined;
    };

    switch (key) {
      case "help":
      case "h":
        options.help = true;
        break;
      case "force":
      case "yes":
      case "y":
        options.force = true;
        break;
      case "email":
        options.email = consumeValue();
        break;
      case "password":
        options.password = consumeValue();
        break;
      case "name":
        options.name = consumeValue();
        break;
      case "school":
        options.school = consumeValue();
        break;
      default:
        console.warn(`[경고] 알 수 없는 옵션을 무시합니다: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
SchoolHub 관리자 계정 스크립트

사용 방법:
  npx tsx scripts/create-admin-user.ts --email admin@example.com --password "Abcd1234!" [--name "관리자"] [--school "스쿨허브"] [--force]

옵션:
  --email     관리자 이메일 (필수)
  --password  관리자 비밀번호 (필수)
  --name      표시 이름 (기본값: "관리자")
  --school    소속 학교 (기본값: "SchoolHub")
  --force     기존 계정이 있어도 비밀번호/역할을 강제로 갱신
  --help      이 도움말 표시
`.trim());
}

async function askQuestion(rl: readline.Interface, question: string, defaultValue?: string) {
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  if (!answer && defaultValue) {
    return defaultValue;
  }
  return answer;
}

async function ensureValue(
  label: string,
  currentValue: string | undefined,
  rl: readline.Interface | null,
  defaultValue?: string
): Promise<string> {
  if (currentValue) return currentValue;

  if (!rl) {
    if (defaultValue) return defaultValue;
    throw new Error(`${label} 값을 제공하거나 인터랙티브 모드에서 입력해주세요.`);
  }

  const answer = await askQuestion(rl, label, defaultValue);
  if (!answer) {
    throw new Error(`${label} 값은 비워둘 수 없습니다.`);
  }

  return answer;
}

async function confirmProceed(rl: readline.Interface): Promise<boolean> {
  const answer = (await rl.question("계속 진행할까요? (y/N): ")).trim().toLowerCase();
  return answer === "y" || answer === "yes";
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const needsPrompt =
    !options.email ||
    !options.password ||
    (!options.force && (!options.name || !options.school));

  const rl = needsPrompt ? readline.createInterface({ input, output }) : null;

  try {
    const email = await ensureValue("관리자 이메일", options.email, rl ?? null);
    const password = await ensureValue("관리자 비밀번호", options.password, rl ?? null);
    const name = await ensureValue("관리자 이름", options.name, rl ?? null, "관리자");
    const school = await ensureValue("소속 학교", options.school, rl ?? null, "SchoolHub");

    if (rl && !options.force) {
      console.log("\n입력 정보 확인");
      console.log(`- 이메일: ${email}`);
      console.log(`- 이름: ${name}`);
      console.log(`- 소속: ${school}`);
      const confirmed = await confirmProceed(rl);
      if (!confirmed) {
        console.log("작업이 취소되었습니다.");
        process.exit(0);
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    const hashedPassword = await bcrypt.hash(password, 12);

    if (existingUser) {
      if (!options.force) {
        console.log("이미 동일한 이메일의 사용자가 존재합니다. --force 옵션으로 강제 갱신할 수 있습니다.");
        process.exit(1);
      }

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          hashedPassword,
          name,
          school,
          role: "admin",
          emailVerified: new Date(),
        },
      });

      console.log(`기존 사용자(${email})를 관리자 계정으로 갱신했습니다.`);
    } else {
      await prisma.user.create({
        data: {
          email,
          hashedPassword,
          name,
          school,
          role: "admin",
          emailVerified: new Date(),
        },
      });

      console.log(`새 관리자 계정이 생성되었습니다: ${email}`);
    }
  } catch (error) {
    console.error("관리자 생성 중 오류가 발생했습니다:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    if (rl) await rl.close();
    await prisma.$disconnect();
  }
}

main();

