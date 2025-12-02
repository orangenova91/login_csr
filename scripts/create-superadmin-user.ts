import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type CliOptions = {
  email?: string;
  password?: string;
  name?: string;
  force?: boolean;
  resetPassword?: boolean;
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
      case "reset-password":
      case "resetpassword":
        options.resetPassword = true;
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
      default:
        console.warn(`[경고] 알 수 없는 옵션을 무시합니다: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
SchoolHub 슈퍼어드민 계정 스크립트

사용 방법:
  # 새 슈퍼어드민 계정 생성
  npx tsx scripts/create-superadmin-user.ts --email superadmin@example.com --password "Abcd1234!" [--name "슈퍼관리자"]
  
  # 슈퍼어드민 비밀번호 재설정 (기존 정보 유지)
  npx tsx scripts/create-superadmin-user.ts --email superadmin@example.com --password "새비밀번호123!" --reset-password
  
  # 기존 계정을 슈퍼어드민으로 강제 갱신 (모든 정보 업데이트)
  npx tsx scripts/create-superadmin-user.ts --email superadmin@example.com --password "Abcd1234!" --force

옵션:
  --email           슈퍼어드민 이메일 (필수)
  --password        슈퍼어드민 비밀번호 (필수)
  --name            표시 이름 (기본값: "슈퍼관리자")
  --reset-password  기존 슈퍼어드민 계정의 비밀번호만 재설정 (다른 정보는 유지)
  --force           기존 계정이 있어도 비밀번호/역할을 모두 강제로 갱신
  --help            이 도움말 표시

예시:
  # 비밀번호를 잊었을 때 (기존 정보 유지)
  npx tsx scripts/create-superadmin-user.ts --email superadmin@schoolhub.com --password "NewPass123!" --reset-password
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
    (!options.force && !options.resetPassword && !options.name);

  const rl = needsPrompt ? readline.createInterface({ input, output }) : null;

  try {
    const email = await ensureValue("슈퍼어드민 이메일", options.email, rl ?? null);
    const password = await ensureValue("슈퍼어드민 비밀번호", options.password, rl ?? null);
    
    // reset-password 모드가 아닐 때만 name 필요
    const name = options.resetPassword ? undefined : await ensureValue("슈퍼어드민 이름", options.name, rl ?? null, "슈퍼관리자");

    if (rl && !options.force && !options.resetPassword) {
      console.log("\n입력 정보 확인");
      console.log(`- 이메일: ${email}`);
      console.log(`- 이름: ${name}`);
      const confirmed = await confirmProceed(rl);
      if (!confirmed) {
        console.log("작업이 취소되었습니다.");
        process.exit(0);
      }
    }
    
    if (options.resetPassword && rl) {
      console.log(`\n비밀번호 재설정 확인`);
      console.log(`- 이메일: ${email}`);
      console.log(`- 비밀번호가 재설정됩니다. 다른 정보는 변경되지 않습니다.`);
      const confirmed = await confirmProceed(rl);
      if (!confirmed) {
        console.log("작업이 취소되었습니다.");
        process.exit(0);
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    const hashedPassword = await bcrypt.hash(password, 12);

    // reset-password 옵션이지만 사용자가 없는 경우
    if (options.resetPassword && !existingUser) {
      console.error(`오류: 이메일(${email})로 등록된 사용자를 찾을 수 없습니다.`);
      console.error(`비밀번호 재설정은 기존 사용자에게만 사용할 수 있습니다.`);
      process.exit(1);
    }

    if (existingUser) {
      // 비밀번호만 재설정하는 경우
      if (options.resetPassword) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            hashedPassword,
          },
        });

        console.log(`슈퍼어드민 계정(${email})의 비밀번호가 재설정되었습니다.`);
        console.log(`다른 정보는 변경되지 않았습니다.`);
      } else if (options.force) {
        // 강제 갱신: 모든 정보 업데이트
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            hashedPassword,
            name,
            role: "superadmin",
            emailVerified: new Date(),
          },
        });

        console.log(`기존 사용자(${email})를 슈퍼어드민 계정으로 갱신했습니다.`);
      } else {
        console.log("이미 동일한 이메일의 사용자가 존재합니다.");
        console.log("  - 비밀번호만 재설정: --reset-password 옵션 사용");
        console.log("  - 모든 정보 강제 갱신: --force 옵션 사용");
        process.exit(1);
      }
    } else {
      await prisma.user.create({
        data: {
          email,
          hashedPassword,
          name,
          role: "superadmin",
          emailVerified: new Date(),
        },
      });

      console.log(`새 슈퍼어드민 계정이 생성되었습니다: ${email}`);
    }
  } catch (error) {
    console.error("슈퍼어드민 생성 중 오류가 발생했습니다:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    if (rl) await rl.close();
    await prisma.$disconnect();
  }
}

main();

