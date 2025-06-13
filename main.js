const bgcolor = document.getElementsByClassName("bg-color");

async function main() {
	//データ取得処理
	const t = await fetch("./timetables.json");
	const c = await fetch("./config.json");
	const timetable = await t.json();
	const config = await c.json();
	const order = config.order;

	// 画面更新処理
	let currentDisplayIndex = 0;
	const rows = document.getElementsByClassName("table-row");

	function updateDisplay() {
		const { dest, lang } = order[currentDisplayIndex];

		const currentBusData = timetable[dest];
		const dayType = getCurrentDayType();

		// テーブルの背景色を更新
		if (currentBusData.config && currentBusData.config.color) {
			const { red, green, blue } = currentBusData.config.color;

			bgcolor[0].style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
			bgcolor[1].style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
			bgcolor[2].style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
		}

		// 現在時刻以降のバスをフィルタリング
		const now = new Date();

		let upcomingBuses = [];
		const timetableForDay = currentBusData.timetable[dayType];

		for (const h in timetableForDay) {
			const hour = parseInt(h);

			timetableForDay[h].forEach((bus) => {
				const busTime = new Date(
					now.getFullYear(),
					now.getMonth(),
					now.getDate(),
					hour,
					bus.m
				);
				if (busTime >= now) {
					upcomingBuses.push({
						id: bus.id,
						time: busTime, // 比較用にDateオブジェクトも保持
					});
				}
			});
		}

		upcomingBuses.sort((a, b) => a.time.getTime() - b.time.getTime());
		const displayBuses = upcomingBuses.slice(0, 6);

		for (let index = 0; index < 6; index++) {
			const bus = displayBuses[index];
			const terminalInfo = currentBusData.terminals[bus.id];
			console.log(terminalInfo);
			const diff = Math.ceil(
				(bus.time.getTime() - now.getTime()) / (1000 * 60)
			);

			const content = {
				time: bus.time,
				keitou: terminalInfo.keitou,
				dest: terminalInfo[lang],
				limit: diff,
			};

			setRow(rows[index + 1], content);
		}

		// 次の表示インデックスに移動
		currentDisplayIndex = (currentDisplayIndex + 1) % order.length;
	}

	// 初期表示とタイマーの開始
	updateCurrentTime(); // 初回時刻表示
	setInterval(updateCurrentTime, 1000); // 1秒ごとに時刻を更新

	updateDisplay();
	setInterval(updateDisplay, 5000);
}

main();

/**
 * 現在時刻をフォーマットして表示する関数
 */
const currentTimeElement = document.getElementById("current-time");

let t = false;

function updateCurrentTime() {
	const now = new Date();
	const month = String(now.getMonth());
	const date = String(now.getDate());
	const hours = String(now.getHours());
	const minutes = String(now.getMinutes()).padStart(2, "0");
	currentTimeElement.textContent = t
		? `${month}/${date}　${hours}:${minutes}`
		: `${month}/${date}　${hours} ${minutes}`;
	t = !t;
}

//  content:
//      time: date
//      keitou: XXX
//      dest: XXXXXX
//      limit: int
function setRow(row, content) {
	const [time, destWrapper, limit] = row.children;
	const [keitou, dest] = destWrapper.children[0].children;
	console.log(timeFormatter(content.time));

	time.textContent = timeFormatter(content.time);
	keitou.textContent = content.keitou;
	dest.textContent = content.dest;
	limit.textContent = content.limit + "分";
}

// date: date
// return: string
function timeFormatter(date) {
	return (
		String(date.getHours()) + ":" + String(date.getMinutes()).padStart(2, "0")
	);
}

// date1: date
// date2: date
// return: int
function calcLimitMin(date1, date2) {
	// diffはミリ秒単位
	const diff = date2 - date1;

	return diff / (1000 * 60);
}

/**
 * 現在の曜日タイプ (平日, 土曜日, 日曜日) を取得する関数
 * @returns {string} 'heijitu', 'saturday', または 'sunday'
 */
function getCurrentDayType() {
	const day = new Date().getDay(); // 0 = 日曜日, 1 = 月曜日, ..., 6 = 土曜日
	if (day === 0) return "sunday";
	if (day === 6) return "saturday";
	return "heijitu"; // 月曜日から金曜日
}
