import { users } from "../src/models";
import type { IUser } from "../src/types/models";
import { createConnection } from "./connect";

const backFill = [
	{
		"_id": "NSAJYEKYZSCWYHXPQDPZ",
		"username": "Soniv",
		"birthday": "07-28"
	},
	{
		"_id": "BESRSTEBVOYWMYSXCBFY",
		"username": "SCUMMYMAGEE",
		"birthday": "09-11"
	},
	{
		"_id": "DLWPBLUHYLNPHSODTIHI",
		"username": "brunchasaur"
	},
	{
		"_id": "SFEUTDGDHBSIHQFTVBKE",
		"username": "TeegsD",
		"birthday": "10-08"
	},
	{
		"_id": "MVPHMDZVMWFXEXNUUIYZ",
		"username": "musicalphoenix10"
	},
	{
		"_id": "TEGHRGQMPZVRSHMPBQEF",
		"username": "dunnk",
		"birthday": "02-10"
	},
	{
		"_id": "JEGEIAIRSNPMXSDIQMPD",
		"username": "AndreaD",
		"birthday": "01-05"
	},
	{
		"_id": "KFRFHEDBDZOSCIXVCNTM",
		"username": "Lord Strauss",
		"birthday": "05-28"
	},
	{
		"_id": "XQRMHDTVOUPXJTEJOTEF",
		"username": "crocay"
	},
	{
		"_id": "YUHOGLUONMAXPWAQBBVZ",
		"username": "ikim919",
		"birthday": "07-28"
	},
	{
		"_id": "FERDVTYAAOYRXMQUDPGO",
		"username": "amandabaildon",
		"birthday": "10-02"
	},
	{
		"_id": "ZYLMGUKIJSDYMRQMUZWO",
		"username": "Jude_Boy",
		"birthday": "11-15"
	},
	{
		"_id": "IWCJVPTMDRTQCIJGBLFE",
		"username": "Crush"
	},
	{
		"_id": "LZMFGQSRSVIEXZYHCMIA",
		"username": "kdespins",
		"birthday": "06-09"
	},
	{
		"_id": "DTNWIQYVVPCXBIONJPEL",
		"username": "Joe M"
	},
	{
		"_id": "OKPEQHSJHAGNZIFJPXKB",
		"username": "princesstatertot"
	},
	{
		"_id": "DDHVKHLWBCOEWLEZPSPJ",
		"username": "ThunderCatsWOAH"
	},
	{
		"_id": "KFPNLXJPIVRRDHJWRVDH",
		"username": "StevenKinneair"
	},
	{
		"_id": "ZLFNVJCPZFIWZUSQSWRG",
		"username": "woodedarea",
		"birthday": "10-17"
	},
	{
		"_id": "SWVVSEDPQMHRJFWHGIKJ",
		"username": "BaconByTheBed",
		"birthday": "01-07"
	},
	{
		"_id": "BGUBYIONSEDYUGSYPHYX",
		"username": "Juan627",
		"birthday": "06-26"
	},
	{
		"_id": "IAPJGTGHONPJXHQWHMSL",
		"username": "Camilleon",
		"birthday": "01-04"
	},
	{
		"_id": "PMNPWGBDARIFSXCJRCHK",
		"username": "Machiavelli",
		"birthday": "04-19"
	},
	{
		"_id": "FPTVPYNKLTHGBSHMJQJJ",
		"username": "Killerrabbit",
		"birthday": "05-12"
	},
	{
		"_id": "UHCZENXCQENXANKCGRJO",
		"username": "Schwein06"
	},
	{
		"_id": "NLRXHGIOBHHMEZVWZNBC",
		"username": "Meggyladon",
		"birthday": "11-15"
	},
	{
		"_id": "JPWEWPQAMNXOLFHJFVMW",
		"username": "Coral_9"
	},
	{
		"_id": "WDLPNLFTGECAOSTCEWKR",
		"username": "Probabaly not forest",
		"birthday": "02-15"
	},
	{
		"_id": "DKNQDPSMFDFOOLINGZNL",
		"username": "agendron",
		"birthday": "02-16"
	},
	{
		"_id": "ASPGZIVDYQXSYBNXBESQ",
		"username": "quinn."
	},
	{
		"_id": "CPKGAJSBXDKHMOPCVYZQ",
		"username": "chip",
		"birthday": "06-18"
	},
	{
		"_id": "UYNJHJEXKFLSPZJIHOGS",
		"username": "HiddenSquid"
	},
	{
		"_id": "WUUNIOTNLLSHNSZIALHQ",
		"username": "oneshotnothing",
		"birthday": "04-26"
	},
	{
		"_id": "ALPNBKQOWNJXQWWGZFJY",
		"username": "wobblyOG",
		"birthday": "03-14"
	},
	{
		"_id": "LQLYKXHYTUNDITMTAEZQ",
		"username": "Wassle"
	},
	{
		"_id": "RKTFDOWQADXJVYJYTQKY",
		"username": "MrThankUvryMuch"
	},
	{
		"_id": "FTYSLWMJDALUWAQSGAPQ",
		"username": "Badonn",
		"birthday": "05-14"
	},
	{
		"_id": "AYOICNKFECZFNFJXDKHY",
		"username": "rustystraw",
		"birthday": "03-03"
	},
	{
		"_id": "OIXKHKMGBQERMNPRBIFI",
		"username": "max12187",
		"birthday": "07-15"
	},
	{
		"_id": "CFOURBRABYOALCUQOWYY",
		"username": "TobyStamkos",
		"birthday": "11-04"
	}
];

export async function main() {
	await createConnection();
	const operations = backFill.reduce((acc, { _id, birthday }) => {
		if (!birthday) return acc;
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
