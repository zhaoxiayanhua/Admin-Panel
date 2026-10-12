// AES 加解密工具类（用于解密 SHEIN API 返回的 secretKey）
import crypto from 'crypto';

const UTF_8 = 'utf-8';
const KEY_ALGORITHM = 'aes-128-cbc';
const DEFAULT_IV_SEED = 'space-station-de'; // SHEIN 固定 IV
const IV_LENGTH = 16;

export class AESTools {
  /**
   * 解密 SHEIN API 返回的加密 secretKey
   * @param encryptedContent Base64 编码的加密内容
   * @param appSecretKey 应用的 AppSecretKey
   * @param ivSeed IV 种子（默认使用 SHEIN 固定值）
   * @returns 解密后的明文
   */
  static decrypt(
    encryptedContent: string,
    appSecretKey: string,
    ivSeed: string = DEFAULT_IV_SEED
  ): string {
    if (!encryptedContent || !appSecretKey) {
      throw new Error('加密内容和密钥不能为空');
    }

    try {
      // 将 appSecretKey 转换为 16 字节密钥
      const keyBuffer = Buffer.from(appSecretKey.substring(0, IV_LENGTH), UTF_8);

      // 将 ivSeed 转换为 16 字节 IV
      const ivBuffer = Buffer.from(ivSeed.substring(0, IV_LENGTH), UTF_8);

      // 创建解密器 - 使用 Uint8Array 来满足类型要求
      const decipher = crypto.createDecipheriv(
        KEY_ALGORITHM,
        new Uint8Array(keyBuffer),
        new Uint8Array(ivBuffer)
      );

      // 直接使用字符串编码重载，避免 Buffer/Uint8Array 泛型冲突
      return (
        decipher.update(encryptedContent, 'base64', UTF_8) +
        decipher.final(UTF_8)
      );
    } catch (error) {
      console.error('AES 解密失败:', error);
      throw new Error('解密失败');
    }
  }

  /**
   * 加密内容（用于测试）
   * @param content 待加密的明文
   * @param appSecretKey 应用的 AppSecretKey
   * @param ivSeed IV 种子
   * @returns Base64 编码的加密内容
   */
  static encrypt(
    content: string,
    appSecretKey: string,
    ivSeed: string = DEFAULT_IV_SEED
  ): string {
    if (!content || !appSecretKey) {
      throw new Error('加密内容和密钥不能为空');
    }

    try {
      const keyBuffer = Buffer.from(appSecretKey.substring(0, IV_LENGTH), UTF_8);
      const ivBuffer = Buffer.from(ivSeed.substring(0, IV_LENGTH), UTF_8);

      const cipher = crypto.createCipheriv(
        KEY_ALGORITHM,
        new Uint8Array(keyBuffer),
        new Uint8Array(ivBuffer)
      );

      return (
        cipher.update(content, UTF_8, 'base64') + cipher.final('base64')
      );
    } catch (error) {
      console.error('AES 加密失败:', error);
      throw new Error('加密失败');
    }
  }
}
