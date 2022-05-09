import { users } from "../src/models";
import type { IUser } from "../src/types/models";
import { createConnection } from "./connect";

const backFill = [
	{
		_id: "CSYUGDAVHWHTFYJWCPWN",
		birthday: "07-28"
	},
	{
		_id: "DLKQRJTSDQNESJKIOGEU",
		birthday: "09-11"
	},
	{
		_id: "ZKYMRPRZHIIHLMMVVIPV",
		birthday: "01-05"
	},
	{
		_id: "LVMCLFIDSHOEZGAKMEMC",
		birthday: "05-28"
	},
	{
		_id: "TTNXSNQOFEYEBZWYUVTQ",
		birthday: "07-28"
	},
	{
		_id: "GQXJHQNNZCVQNSDDMSCV",
		birthday: "11-15"
	},
	{
		_id: "XIYFQCFRGBJRAQZSIWGG",
		birthday: "10-02"
	},
	{
		_id: "MXSLJAKXPTFYXGTWVFHX",
		birthday: "06-09"
	},
	{
		_id: "AXGSAALJWWPLMYNYFLOQ",
		birthday: "01-07"
	},
	{
		_id: "VVBZJQHKGLSYBFJSMCDD",
		birthday: "10-17"
	},
	{
		_id: "BNQVQPFTLMLICMGIOBBZ",
		birthday: "01-04"
	},
	{
		_id: "RCBOLVQCKGPEKTKYIAHQ",
		birthday: "06-26"
	},
	{
		_id: "YLOMHSMTCPXPERISTCYX",
		birthday: "04-19"
	},
	{
		_id: "MMIGGSPJDEVODKBFUYSW",
		birthday: "05-12"
	},
	{
		_id: "REWGRTXWPRFOMQBYOEOL",
		birthday: "11-15"
	},
	{
		_id: "OFEBZLVACCNETEWBWBTP",
		birthday: "02-15"
	},
	{
		_id: "OBJBIMWIUGAFPEPIMAIS",
		birthday: "02-16"
	},
	{
		_id: "XQIEFCXZNVRSQXTUENMH",
		birthday: "06-18"
	},
	{
		_id: "MQZRNODCNMKIBNXUBQLU",
		birthday: "04-26"
	},
	{
		_id: "NZOLWDBIIHFQQFKZIPXA",
		birthday: "03-14"
	}, {
		_id: "SZGDTOIGZLDUECXGUFIS",
		birthday: "05-14"
	},
	{
		_id: "QRRHCCNKPTMYUDZZVIAC",
		birthday: "03-03"
	},
	{
		_id: "ZPZRGSMGXUTQILVUCQFL",
		birthday: "07-15"
	},
	{
		_id: "USINNOVDHJIGTMVKTXZO",
		birthday: "11-04"
	},
	{
		_id: "BAOJJLHCVOIUXITGGGUW",
		birthday: "02-10"
	},
	{
		_id: "PSBAADJQOUPWMISKEWAJ",
		birthday: "10-08"
	}
];

export async function main() {
	await createConnection();
	const operations = backFill.reduce((acc, { _id, birthday }) => {
		acc.push(users.updateOne({ _id }, { birthday: new Date(birthday).toISOString() }));
		return acc;
	}, [] as Promise<IUser | null>[]);
	const done = await Promise.all(operations);
	console.log(done.length);
	process.exit(0);
}

try {
	main();
} catch (error) {
	console.log({ error });
}
