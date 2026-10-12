import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { openKeyId, secretKey } = await request.json();

    if (!openKeyId || !secretKey) {
      return NextResponse.json(
        { code: '1', msg: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 读取现有的 .env.local 文件
    const envPath = join(process.cwd(), '.env.local');
    let envContent = '';

    try {
      envContent = readFileSync(envPath, 'utf-8');
    } catch (error) {
      // 如果文件不存在，使用空字符串
      envContent = '';
    }

    // 更新或添加 SHEIN 凭证
    const lines = envContent.split('\n');
    let openKeyIdUpdated = false;
    let secretKeyUpdated = false;

    const updatedLines = lines.map(line => {
      if (line.startsWith('SHEIN_OPEN_KEY_ID=')) {
        openKeyIdUpdated = true;
        return `SHEIN_OPEN_KEY_ID=${openKeyId}`;
      }
      if (line.startsWith('SHEIN_SECRET_KEY=')) {
        secretKeyUpdated = true;
        return `SHEIN_SECRET_KEY=${secretKey}`;
      }
      return line;
    });

    // 如果没有找到对应的环境变量，添加到文件末尾
    if (!openKeyIdUpdated) {
      updatedLines.push(`SHEIN_OPEN_KEY_ID=${openKeyId}`);
    }
    if (!secretKeyUpdated) {
      updatedLines.push(`SHEIN_SECRET_KEY=${secretKey}`);
    }

    // 写回文件
    const newEnvContent = updatedLines.join('\n');
    writeFileSync(envPath, newEnvContent, 'utf-8');

    return NextResponse.json({
      code: '0',
      msg: '凭证保存成功',
      info: {
        message: '授权凭证已保存到 .env.local 文件',
        note: '请重启开发服务器以使环境变量生效',
      },
    });
  } catch (error) {
    console.error('保存凭证失败:', error);
    return NextResponse.json(
      {
        code: '1',
        msg: '保存凭证失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
