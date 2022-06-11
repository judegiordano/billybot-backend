import { S3 } from "aws-sdk";

export class Bucket {
	private s3: S3;
	private bucketName: string;

	constructor(bucketName: string) {
		this.s3 = new S3();
		this.bucketName = bucketName;
	}

	public async getObject(key: string) {
		const params = { Bucket: this.bucketName, Key: key };
		const url = this.s3.getSignedUrl("getObject", params);
		const file = await this.s3.getObject(params).promise();
		return { file, key, url };
	}

	public buildPublicUrl(key: string) {
		return new URL(`https://${this.bucketName}.s3.amazonaws.com/${key}`);
	}
}
