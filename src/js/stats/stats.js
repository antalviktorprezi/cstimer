"use strict";

var stats = execMain(function(kpretty, round, kpround) {
	var times = [];
	var div = $('<div id="stats" />');
	var stext = $('<textarea rows="10" readonly />');
	var scrollDiv = $('<div class="myscroll" />');
	var statOptDiv = $('<div>');
	var hideOptButton = $('<input type="button" value="&#8675;">');

	var table = $('<table />').click(procClick).addClass("table");
	var title = $('<tr />');

	var avgRow = $('<tr />');
	var showAllRow = $('<tr class="click" ><th class="click" colspan="15">...</th></tr>');

	var sumtable = $('<table class="sumtable" />').click(function(e) {
		infoClick(times_stats, timesAt, e);
	}).addClass("table");
	var sumtableDiv = $('<div class="statc" />');

	var MAX_ITEMS = 50;

	function push(time) {
		if (typeof time[0] == "string") {
			// times.push([time[2], time[1] || curScramble, time[0]]);
			// times_stats.push([time[2], time[1] || curScramble, time[0], Math.round((new Date().getTime() - time[2][1]) / 1000)]);
			times.push([time[2], time[1] || curScramble, time[0], time[3] || Math.round((new Date().getTime() - time[2][1]) / 1000)])
			times_stats.pushed();
			time = time[2];
		} else {
			// times.push([time, curScramble, ""]);
			// times_stats.push([time, curScramble, "", Math.round((new Date().getTime() - time[1]) / 1000)]);
			times.push([time, curScramble, "", Math.round((new Date().getTime() - time[1]) / 1000)]);
			times_stats.pushed();
		}
		sessionManager.save(times.length - 1);
		if (time.length - 1 > curDim) {
			updateTable(true);
		} else {
			if (kernel.getProp('statinv')) {
				avgRow.before(getTimeRow(times.length - 1, curDim));
				scrollDiv.scrollTop(table[0].scrollHeight);
			} else {
				title.after(getTimeRow(times.length - 1, curDim));
				scrollDiv.scrollTop(0);
			}
			updateAvgRow(curDim);
			if (times.length > MAX_ITEMS) {
				(kernel.getProp('statinv') ? showAllRow.next() : showAllRow.prev()).remove();
				hideAll();
			}
		}
		updateUtil();
	}

	function delIdx(index) {
		var n_del;
		if (kernel.getProp("delmul")) {
			n_del = prompt(STATS_CFM_DELMUL, 1);
			if (n_del == null || !/^\d+$/.exec(n_del) || ~~n_del == 0) {
				return;
			}
		} else {
			if (!confirm(STATS_CFM_DELETE)) {
				return;
			}
			n_del = 1;
		}
		times.splice(index, ~~n_del);
		times_stats.reset(times.length);
		sessionManager.save(index);
		updateTable(false);
		return true;
	}

	function getMean(dim) {
		var sum = 0;
		var cntdnf = 0;
		for (var i = 0; i < times.length; i++) {
			var curTime = timesAt(i)[0];
			if (curTime[0] == -1 || curTime.length <= dim) {
				cntdnf += 1;
			} else {
				sum += timeAtDim(dim, i);
			}
		}
		if (cntdnf == times.length) {
			return -1;
		} else {
			return sum / (times.length - cntdnf);
		}
	}

	function pretty(time, showDNF) {
		switch (time[0]) {
		case 0: return kpretty(time[1]);
		case -1: return "DNF" + (showDNF ? ("(" + kpretty(time[1]) + ")") : "");
		default: return kpretty(time[0] + time[1]) + "+";
		}
	}

	function prettyMPA(time) { // multi phase append, e.g. "=XXX+XXX+XXX..."
		if (time.length == 2) {
			return ""
		}
		var ret = [];
		ret.push(kpretty(time[time.length - 1]));
		for (var j = time.length - 2; j >= 1; j--) {
			ret.push(kpretty(time[j] - time[j + 1]));
		}
		return "=" + ret.join("+");
	}

	var floatCfm = (function() {
		var cfmDiv = $('<div style="text-align:center; font-family: initial;">');
		var cfmTime = $('<span style="font-size:2.5em;"/>');
		var cfmTxtR = $('<input type="text">').css('width', '8em');
		var cfmDelR = $('<input type="button" data="d">').val("X");
		var cfmScrR = $('<input type="text" readonly>').css('width', '8em');
		var cfmDate = $('<input type="text" readonly>').css('width', '8em');

		var cfmIdx = 0;
		var cfmIdxRow;

		function procTxt() {
			timesAt(cfmIdx)[2] = cfmTxtR.val();
			sessionManager.save(cfmIdx);
			getTimeRow(cfmIdx, curDim, cfmIdxRow);
		}

		function procClk(e) {
			var target = $(e.target);
			var which = target.attr('data');
			if (!which) {
				return;
			}
			if (which == 'p') {
				var selected = {"OK": 0, "+2": 2000, "DNF": -1}[target.html()];
				setPenalty(selected, cfmIdx, cfmIdxRow);
			} else if (which == 'd') {
				if (delIdx(cfmIdx)) {
					cfmIdx = undefined;
					hideToTools();
				}
			}
		}

		function delLast() {
			if (times.length != 0 && delIdx(times.length - 1)) {
				cfmIdx = undefined;
				hideToTools();
			}
		}

		function hideToTools() {
			if (kernel.isDialogShown('cfm')) {
				kernel.hideDialog();
			}
			if (toolDiv) {
				cfmDiv.css('font-size', '0.8em');
				toolDiv.empty().append(cfmDiv);
				cfmIdx = times.length - 1;
				cfmIdxRow = kernel.getProp('statinv') ? avgRow.prev() : title.next();
				genDiv();
			}
		}

		function genDiv() {
			if (!times[cfmIdx]) {
				cfmDiv.empty();
				return;
			}
			var time = timesAt(cfmIdx);
			cfmDiv.empty().append(cfmTime, '<br>', prettyMPA(time[0]), '<br>')
				.append('<span class="click" data="p">OK</span> | <span class="click" data="p">+2</span> | <span class="click" data="p">DNF</span>', ' | ', cfmDelR)
				.append('<br>', $('<table style="display:inline-block;">').append(
					$('<tr>').append('<td>' + STATS_COMMENT + '</td>', $('<td>').append(cfmTxtR)),
					$('<tr>').append('<td>' + SCRAMBLE_SCRAMBLE + '</td>', $('<td>').append(cfmScrR)),
					$('<tr>').append('<td>' + STATS_DATE + '</td>', $('<td>').append(cfmDate))
				)).unbind('click').click(procClk);
			cfmTime.html(pretty(time[0], true));
			cfmScrR.val(time[1]);
			cfmDate.val(mathlib.time2str(time[3]))
			cfmTxtR.val(time[2]).unbind('change').change(procTxt);
		}

		function proc(idx, target) {
			cfmIdx = idx;
			cfmIdxRow = target.parent();
			genDiv();
			cfmDiv.css('font-size', '1.2em');
			kernel.showDialog([cfmDiv, hideToTools, undefined, hideToTools], 'cfm', 'Solves No.' + (idx + 1));
		}

		function setPenalty(value, idx, idxRow) {
			if (timesAt(idx)[0][0] == value) {
				return;
			}
			timesAt(idx)[0][0] = value;
			times_stats.reset(times.length);
			sessionManager.save(idx);
			updateFrom(idx, idxRow);
			updateUtil();
			getTimeRow(idx, curDim, idxRow);
			if (idx == cfmIdx) {
				genDiv();
			}
		}

		function setCfm(value) {
			if (times.length == 0) {
				return;
			}
			setPenalty(value, times.length - 1, kernel.getProp('statinv') ? avgRow.prev() : title.next());
		}

		var toolDiv;

		function execFunc(fdiv, signal) {
			toolDiv = fdiv;
			if (fdiv == undefined) {
				return;
			}
			hideToTools();
		}

		$(function() {
			tools.regTool('cfm', TOOLS_CFMTIME, execFunc);
			kernel.regListener('cfm', 'session', hideToTools);
		});

		return {
			proc: proc,
			delLast: delLast,
			setCfm: setCfm
		}
	})();

	function showAll(e) {
		var len = (kernel.getProp('statinv') ? avgRow : showAllRow).index() - 2;
		var end = Math.max(0, times.length - len);
		var start = Math.max(0, times.length - len - MAX_ITEMS);

		var rows = [];
		for (var i = start; i < end; i++) {
			rows.push(getTimeRow(i, curDim));
		}
		if (kernel.getProp('statinv')) {
			showAllRow.after(rows.join(""));
		} else {
			showAllRow.before(rows.reverse().join(""));
		}
		if (start == 0) {
			showAllRow.unbind('click').hide();
		}
	}

	function hideAll() {
		var target = kernel.getProp('statinv') ? avgRow : showAllRow;
		for (var len = target.index() - 2; len > MAX_ITEMS; len--) {
			(kernel.getProp('statinv') ? showAllRow.next() : showAllRow.prev()).remove();
		}
		if (times.length > MAX_ITEMS) {
			showAllRow.unbind('click').click(showAll).show();
		}
	}

	function updateFrom(idx, idxRow) {
		for (var i = idx + 1; i < idx + Math.max(len1, len2) && i < times.length; i++) {
			idxRow = kernel.getProp('statinv') ? idxRow.next() : idxRow.prev();
			getTimeRow(i, curDim, idxRow);
		}
		updateAvgRow(curDim);
	}

	var curDim = 0;

	function procClick(e) {
		var target = $(e.target);
		if (!target.is('td') || target.html() == '-') {
			return;
		}
		var prev = target.prevAll();
		var row = prev.length;
		var idx = ~~(row == 0 ? target : prev.eq(-1)).html().replace("*", "") - 1;
		if (row > 4 || row < 0) {
			return;
		}
		switch (row) {
			case 0: setHighlight(times_stats, timesAt, idx, 1, 10, true); break;
			case 1: floatCfm.proc(idx, target); break;
			case 2: setHighlight(times_stats, timesAt, idx - len1 + 1, len1, len1 * 10, stat1 < 0); break;
			case 3: setHighlight(times_stats, timesAt, idx - len2 + 1, len2, len2 * 10, stat2 < 0); break;
		}
	}

	function procAvgClick(e) {
		var target = $(e.target);
		var idx = ~~target.attr('data');
		var stats = times_stats;
		if (idx != 0) {
			stats = new TimeStat(avgSizes, times.length, timeAtDim.bind(undefined, idx), dnfsort);
		}
		getStats(stats, timesAt, idx == 0 ? 0 : STATS_CURSPLIT.replace('%d', idx));
	}

	function getAvgSignal(i) {
		var st1 = times_stats.runAvgMean(i - len1 + 1, len1, 0, stat1 > 0 ? undefined : 0);
		var st2 = times_stats.runAvgMean(i - len2 + 1, len2, 0, stat2 > 0 ? undefined : 0);
		kernel.pushSignal('avg', [
			(stat1 > 0 ? 'ao' : 'mo') + len1 + ": " + (st1 ? kpround(st1[0][0]) : "-"),
			(stat2 > 0 ? 'ao' : 'mo') + len2 + ": " + (st2 ? kpround(st2[0][0]) : "-"),
			st1 ? [i - len1 + 1, len1, len1 * 10, stat1 < 0] : undefined,
			st2 ? [i - len2 + 1, len2, len2 * 10, stat2 < 0] : undefined,
			setHighlight.bind(undefined, times_stats, timesAt)
		]);
	}

	function getTimeRow(i, dim, tr) {
		var time = timesAt(i);
		var curTime = time[0];

		var ret = [];

		ret.push(
			'<td class="times">' + (time[2] && "*") + (i + 1) + '</td>' +
			'<td class="times">' + pretty(curTime, false) + '</td>'
		);

		var st1 = times_stats.runAvgMean(i - len1 + 1, len1, 0, stat1 > 0 ? undefined : 0);
		var st2 = times_stats.runAvgMean(i - len2 + 1, len2, 0, stat2 > 0 ? undefined : 0);
		ret.push(
			'<td' + (st1 ? ' class="times"' : "") + '>' + (st1 ? kpround(st1[0][0]) : "-") + '</td>' +
			'<td' + (st2 ? ' class="times"' : "") + '>' + (st2 ? kpround(st2[0][0]) : "-") + '</td>'
		);
		if (dim > 1) {
			ret.push('<td>' + kpretty(curTime[curTime.length - 1]) + '</td>');
			for (var j = curTime.length - 2; j >= 1; j--) {
				ret.push('<td>' + kpretty(curTime[j] - curTime[j + 1]) + '</td>');
			}
			for (var j = curTime.length - 1; j < dim; j++) {
				ret.push('<td>-</td>');
			}
		}
		ret = ret.join("");
		tr && tr.html(ret);
		return '<tr>' + ret + '</tr>';
	}

	function updateAvgRow(dim) {
		avgRow.empty().unbind("click").click(procAvgClick);
		var len = times.length;
		var data = times_stats.getAllStats();
		avgRow.append('<th colspan="4" data="0" class="times">' + STATS_SOLVE + ': ' + (len - data[0]) + '/' + len + '<br>' +
			STATS_AVG + ': ' + kpround(data[1]) + '</th>').css('font-size', '1.2em')
		if (dim > 1) {
			for (var j = 1; j <= dim; j++) {
				avgRow.append('<th data="' + j + '" class="times">' + kpround(getMean(j)) + '</th>').css('font-size', '');
			}
		}
	}

	function updateTable(scroll) {
		curDim = 1;
		for (var i = 0; i < times.length; i++) {
			curDim = Math.max(curDim, timesAt(i)[0].length - 1);
		}
		updateTitleRow();
		var rows = [];
		for (var i = Math.max(0, times.length - MAX_ITEMS), len = times.length; i < len; i++) {
			rows.push(getTimeRow(i, curDim));
		}
		if (kernel.getProp('statinv')) {
			table.empty().append(title, showAllRow, rows.join(""), avgRow);
		} else {
			table.empty().append(avgRow, title, rows.reverse().join(""), showAllRow);
		}
		if (times.length > MAX_ITEMS) {
			showAllRow.unbind('click').click(showAll).show();
		} else {
			showAllRow.unbind('click').hide();
		}
		updateAvgRow(curDim);
		updateUtil();
		scrollDiv.scrollTop(kernel.getProp('statinv') ? table[0].scrollHeight : 0);
	}

	function updateSumTable() {
		if (!kernel.getProp('statsum')) {
			sumtable.empty();
			sumtableDiv.hide();
			resultsHeight();
			return;
		} else {
			sumtableDiv.css('display', 'inline-block');
		}
		times_stats.getAllStats();
		var s = [];
		s.push('<tr><th>time</th>');
		if (times.length > 0) {
			var idx = times.length - 1;
			s.push('<td class="times click" data="cs">' + kpretty(timeAt(idx)) + '</td>');
			s.push('<td class="times click" data="bs">' + kpretty(times_stats.bestTime) + '</td></tr>');
		} else {
			s.push('<td><span>-</span></td>');
			s.push('<td><span>-</span></td></tr>');
		}
		for (var j = 0; j < avgSizes.length; j++) {
			var size = Math.abs(avgSizes[j]);
			if (times.length >= size) {
				s.push('<tr><th>' + 'am' [avgSizes[j] >>> 31] + 'o' + size + '</th>');
				s.push('<td class="times click" data="c' + 'am' [avgSizes[j] >>> 31] + j + '">' + kpround(times_stats.lastAvg[j][0]) + '</td>');
				s.push('<td class="times click" data="b' + 'am' [avgSizes[j] >>> 31] + j + '">' + kpround(times_stats.bestAvg[j][0]) + '</td></tr>');
			}
		}
		s = s.join("");
		sumtable.empty().append($('<tr>').append('<th></th><th>' + hlstr[1] + '</th><th>' + hlstr[0] + '</th>'), s);
		resultsHeight();
	}

	function updateUtil() {
		updateSumTable();
		assistant.update();
		distribution.update();
		trend.update();
		getAvgSignal(times.length - 1);
	}

	var avgSizes = [-3, 5, 12, 50, 100, 1000];
	var times_stats = new TimeStat(avgSizes, times.length, timeAt, dnfsort);

	function detailTimeLine(idx, time, trimList) {
		var c = pretty(time[0], true) + prettyMPA(time[0]) + (time[2] ? "[" + time[2] + "]" : "");
		if ($.inArray(idx, trimList) != -1) {
			c = "(" + c + ")";
		}
		if (kernel.getProp('printScr')) {
			c += "   " + time[1];
		}
		if (kernel.getProp('printDate')) {
			c += "   @" + mathlib.time2str(time[3]);
		}
		if (kernel.getProp('printScr') || kernel.getProp('printDate')) {
			return (idx + 1) + ". " + c + " \n";
		} else {
			return c + ", ";
		}
	}

	function setHighlight(times_stats, timesAt, start, nsolves, id, mean) {
		if (times_stats.timesLen == 0) return;
		var data = [0, [null], [null]];
		var trimList = [];
		if (start + nsolves != 0) {
			if (mean) {
				data = times_stats.runAvgMean(start, nsolves, 0, 0)[0];
			} else {
				data = times_stats.runAvgMean(start, nsolves)[0];
				trimList = times_stats.getTrimList(start, nsolves, data[2], data[3]);
			}
		}

		var tstr = "";
		if (kernel.getProp('printDate') && nsolves > 2) {
			var tstart = timesAt(start);
			var tend = timesAt(start + nsolves - 1);
			tstr = hlstr[11].replace("%s", mathlib.time2str(tstart && tstart[3]))
				.replace("%e", mathlib.time2str(tend && tend[3]));
			tstr = " (" + tstr + ")";
		}
		var s = [mathlib.time2str(+new Date / 1000, hlstr[3]) + tstr + "\n"];
		if (id > 1) {
			if (id == 2) {
				s.push(hlstr[8]); //"Session average";
			} else if (id == 10) {
				s.push(hlstr[5]);
			} else if (mean) {
				s.push(hlstr[6].replace("%mk", ~~(id / 10))); //"Mean of "+~~(id/10);
			} else {
				s.push(hlstr[7].replace("%mk", ~~(id / 10))); //"Average of "+~~(id/10);
			}
			s.push(": " + kpround(data[0]));
		}

		s.push("\n\n" + hlstr[10] + "\n");
		for (var i = 0; i < nsolves; i++) {
			s.push(detailTimeLine(kernel.getProp('absidx') ? start + i : i, timesAt(start + i), trimList));
		}
		s = s.join("").slice(0, -2);
		stext.val(s);
		kernel.showDialog([stext, clearText, undefined, clearText, [STATS_EXPORTCSV, function() {
			exportCSV(times_stats, timesAt, start, nsolves);
			return false;
		}]], 'stats', STATS_CURROUND);
		stext[0].select();
	}

	function csvField(val) {
		val = val.toString();
		if (val.indexOf(';') != -1 || val.indexOf('\n') != -1) {
			val = '"' + val.replace(/"/g, '""') + '"';
		}
		return val;
	}

	function exportCSV(times_stats, timesAt, start, nsolves) {
		if (times_stats.timesLen == 0) return;
		if (!window.Blob) {
			alert('Do not support your browser!');
		}
		var s = ["No.;Time;Comment;Scramble;Date"];
		for (var i = 0; i < curDim; i++) {
			s[0] += ";P." + (i + 1);
		}
		for (var i = 0; i < nsolves; i++) {
			var time = timesAt(start + i);
			var line = [];
			line.push(i + 1);
			line.push(pretty(time[0], true));
			line.push(time[2] ? time[2] : "");
			line.push(time[1]);
			line.push(mathlib.time2str(time[3]));
			line.push(kpretty(time[0][time[0].length - 1]));
			for (var j = time[0].length - 2; j >= 1; j--) {
				line.push(kpretty(time[0][j] - time[0][j + 1]));
			}
			for (var j = time[0].length - 1; j < curDim; j++) {
				line.push('');
			}
			for (var j = 0; j < line.length; j++) {
				line[j] = csvField(line[j]);
			}
			s.push(line.join(';'));
		}
		s = s.join("\r\n");
		var blob = new Blob([s], { 'type': 'text/csv' });
		var outFile = $('<a class="click"/>').appendTo('body');
		outFile.attr('href', URL.createObjectURL(blob));
		outFile.attr('download', 'csTimerExport_' + mathlib.time2str(new Date()/1000, '%Y%M%D_%h%m%s') + '.csv');
		outFile[0].click();
		outFile.remove();
	}

	function infoClick(times_stats, timesAt, e) {
		var which = $(e.target).attr('data');
		if (which == undefined) {
			return;
		}
		var idx = ~~(which.substr(2));
		switch (which.substr(0, 2)) {
		case 'bs': setHighlight(times_stats, timesAt, times_stats.bestTimeIndex, 1, 10, true); break;
		case 'cs': setHighlight(times_stats, timesAt, times_stats.timesLen - 1, 1, 10, true); break;
		case 'ws': setHighlight(times_stats, timesAt, times_stats.worstTimeIndex, 1, 10, true); break;
		case 'bm': setHighlight(times_stats, timesAt, times_stats.bestAvgIndex[idx], -avgSizes[idx], -avgSizes[idx] * 10, true); break;
		case 'cm': setHighlight(times_stats, timesAt, times_stats.timesLen + avgSizes[idx], -avgSizes[idx], -avgSizes[idx] * 10, true); break;
		case 'ba': setHighlight(times_stats, timesAt, times_stats.bestAvgIndex[idx], avgSizes[idx], avgSizes[idx] * 10, false); break;
		case 'ca': setHighlight(times_stats, timesAt, times_stats.timesLen - avgSizes[idx], avgSizes[idx], avgSizes[idx] * 10, false); break;
		case 'tt': getStats(times_stats, timesAt); break;
		}
	}

	var hlstr = STATS_STRING.split('|');
	for (var i = 0; i < 13; i++) {
		hlstr[i] = hlstr[i] || '';
	}

	var crossSessionStats = (function() {
		var langStr = STATS_XSESSION_DATE.split('|');
		var toolDiv = $('<div />').css('text-align', 'center').css('font-size', '0.7em')
		var infoDiv = $('<div />');
		var nameSelect = $('<select>');
		var dateSelect = $('<select>').append(
			$('<option>').val(-1).html(langStr[0]),
			$('<option>').val(1).html(langStr[1]),
			$('<option>').val(7).html(langStr[2]),
			$('<option>').val(30).html(langStr[3]),
			$('<option>').val(365).html(langStr[4])
		).val(-1);
		var scrSelect = $('<select>');
		var calcSpan = $('<span class="click">' + STATS_XSESSION_CALC + '</span>');
		var hugeStats = new TimeStat([], 0, hugeTimeAt, dnfsort);
		var hugeTimes = [];

		function hugeTimeAt(idx) {
			return (hugeTimes[idx][0][0] == -1) ? -1 : (~~((hugeTimes[idx][0][0] + hugeTimes[idx][0][1]) / roundMilli)) * roundMilli;
		}

		function hugeTimesAt(idx) {
			return hugeTimes[idx];
		}

		function updateInfo() {
			hugeTimes = [];
			var loadproc = Promise.resolve();
			var sessionN = ~~kernel.getProp('sessionN');
			var sessionData = JSON.parse(kernel.getProp('sessionData'));
			var selectedName = nameSelect.val();
			var selectedScr = scrSelect.val();
			var dateThreshold = dateSelect.val() == -1 ? -1 : (~~(+new Date / 1000) - dateSelect.val() * 86400);
			for (var i = 0; i < sessionN; i++) {
				var idx = sessionManager.rank2idx(i + 1);
				if (selectedName != '*' && sessionData[idx]['name'] != selectedName) {
					continue;
				}
				if (selectedScr != '*' && sessionData[idx]['scr'] != selectedScr) {
					continue;
				}
				loadproc = loadproc.then((function(idx) {
					return new Promise(function(resolve) {
						storage.get(idx, function(newTimes) {
							for (var i = 0; i < newTimes.length; i++) {
								if ((newTimes[i][3] || 0) < dateThreshold) {
									continue;
								}
								hugeTimes.push(newTimes[i]);
							}
							resolve();
						});
					});
				}).bind(undefined, idx));
			}
			loadproc.then(function() {
				var sortedArr = [];
				for (var i = 0; i < hugeTimes.length; i++) {
					sortedArr.push(i);
				}
				sortedArr.sort(function(a, b) {
					var idxa = hugeTimes[a][3] || 0;
					var idxb = hugeTimes[b][3] || 0;
					return idxa == idxb ? (a - b) : (idxa - idxb);
				});
				for (var i = 0; i < hugeTimes.length; i++) {
					sortedArr[i] = hugeTimes[sortedArr[i]];
				}
				hugeTimes = sortedArr;
				hugeStats.reset(hugeTimes.length);
				updateSpan();
			});
		}

		function updateSpan() {
			var theStats = hugeStats.getAllStats();
			var numdnf = theStats[0];
			var sessionmean = theStats[1];

			var totalTime = 0;
			for (var i = 0; i < hugeTimes.length; i++) {
				totalTime += hugeTimes[i][0][1];
			}

			var s = [];
			s.push('<span class="click" data="tt">' + hlstr[4].replace("%d", (hugeStats.timesLen - numdnf) + "/" + hugeStats.timesLen) + ', ' + hlstr[9].replace("%v", kpround(sessionmean)) + '</span>\n');
			s.push('<span>' + hlstr[12].replace("%d", kpretty(totalTime)) + '</span>\n');
			s.push(hlstr[0] + ": " + '<span class="click" data="bs">' + kpretty(hugeStats.bestTime) + '</span>');
			s.push(' | ' + hlstr[2] + ": " + '<span class="click" data="ws">' + kpretty(hugeStats.worstTime) + "</span>\n");
			var hasTable = false;
			var tableHead = '<table class="table"><tr><td></td><td>' + hlstr[1] + '</td><td>' + hlstr[0] + '</td></tr>';
			for (var j = 0; j < avgSizes.length; j++) {
				var size = Math.abs(avgSizes[j]);
				if (hugeStats.timesLen >= size) {
					hasTable || (hasTable = true, s.push(tableHead));
					s.push('<tr><td>' + hlstr[7 - (avgSizes[j] >>> 31)].replace("%mk", size));
					s.push('<td><span class="click" data="c' + 'am' [avgSizes[j] >>> 31] + j + '">' + kpround(hugeStats.lastAvg[j][0]) + " (σ=" + trim(hugeStats.lastAvg[j][1], 2) +
						')</span></td>');
					s.push('<td><span class="click" data="b' + 'am' [avgSizes[j] >>> 31] + j + '">' + kpround(hugeStats.bestAvg[j][0]) + " (σ=" + trim(hugeStats.bestAvg[j][1], 2) +
						')</span></td></tr>');
				}
			}
			hasTable && s.push('</table>');
			s = s.join("");
			infoDiv.html(s.replace(/\n/g, '<br>'));
		}

		var isEnable = false;

		function execFunc(fdiv, signal) {
			if (!(isEnable = (fdiv != undefined))) {
				return;
			}
			if (/^scr/.exec(signal)) {
				return;
			}
			fdiv.empty().append(toolDiv);
			calcSpan.unbind('click').click(updateInfo);
			infoDiv.unbind('click').click(function(e) {
				infoClick(hugeStats, hugeTimesAt, e);
			});
		}

		var prevSessionData = {};
		function procSignal(signal, value) {
			if (value[0] == 'sessionData') {
				var isModified = false;
				var curSessionData = JSON.parse(value[1]);
				$.each(curSessionData, function(idx, val) {
					if (!prevSessionData[idx] ||
						val['name'] != prevSessionData[idx]['name'] ||
						val['scr'] != prevSessionData[idx]['scr']) {
						isModified = true;
					}
				});
				prevSessionData = JSON.parse(value[1]);
				if (!isModified) {
					return;
				}
				var sessionData = JSON.parse(value[1]);
				var nameList = [];
				var scrList = [];
				nameSelect.empty().append($('<option />').val('*').html(STATS_XSESSION_NAME));
				scrSelect.empty().append($('<option />').val('*').html(STATS_XSESSION_SCR));
				$.each(sessionData, function(idx, val) {
					var curLabel = val['name'];
					if ($.inArray(curLabel, nameList) == -1) {
						nameList.push(curLabel);
						nameSelect.append($('<option />').val(curLabel).html(curLabel));
					}
					var curScr = val['scr'];
					if ($.inArray(curScr, scrList) == -1) {
						scrList.push(curScr);
						scrSelect.append($('<option />').val(curScr).html(scramble.getTypeName(curScr)));
					}
				});
			}
		}

		$(function() {
			toolDiv.append(nameSelect, dateSelect, scrSelect, ' ', calcSpan, '<br>', infoDiv);
			if (typeof tools != "undefined") {
				tools.regTool('hugestats', TOOLS_HUGESTATS, execFunc);
			}
			kernel.regListener('labelstat', 'property', procSignal, /^sessionData$/);
		});

		return {
			update: $.noop,
			updateStatal: function(avgSizes) {
				hugeStats = new TimeStat(avgSizes, 0, hugeTimeAt, dnfsort);
			}
		}

	})();

	var assistant = (function() {

		var infoDiv = $('<div />').css('text-align', 'center').css('font-size', '0.7em');

		function updateInfo() {
			if (!isEnable) {
				return;
			}

			var theStats = times_stats.getAllStats();
			var numdnf = theStats[0];
			var sessionmean = theStats[1];

			var totalTime = 0;
			for (var i = 0; i < times.length; i++) {
				totalTime += times[i][0][1];
			}
			var s = [];
			s.push('<span class="click" data="tt">' + hlstr[4].replace("%d", (times_stats.timesLen - numdnf) + "/" + times_stats.timesLen) + ', ' + hlstr[9].replace("%v", kpround(sessionmean)) + '</span>\n');
			s.push('<span>' + hlstr[12].replace("%d", kpretty(totalTime)) + '</span>\n');
			s.push(hlstr[0] + ": " + '<span class="click" data="bs">' + kpretty(times_stats.bestTime) + '</span>');
			s.push(' | ' + hlstr[2] + ": " + '<span class="click" data="ws">' + kpretty(times_stats.worstTime) + "</span>\n");
			var hasTable = false;
			var tableHead = '<table class="table"><tr><td></td><td>' + hlstr[1] + '</td><td>' + hlstr[0] + '</td></tr>';
			for (var j = 0; j < avgSizes.length; j++) {
				var size = Math.abs(avgSizes[j]);
				if (times_stats.timesLen >= size) {
					hasTable || (hasTable = true, s.push(tableHead));
					s.push('<tr><td>' + hlstr[7 - (avgSizes[j] >>> 31)].replace("%mk", size));
					s.push('<td><span class="click" data="c' + 'am' [avgSizes[j] >>> 31] + j + '">' + kpround(times_stats.lastAvg[j][0]) + " (σ=" + trim(times_stats.lastAvg[j][1], 2) +
						')</span></td>');
					s.push('<td><span class="click" data="b' + 'am' [avgSizes[j] >>> 31] + j + '">' + kpround(times_stats.bestAvg[j][0]) + " (σ=" + trim(times_stats.bestAvg[j][1], 2) +
						')</span></td></tr>');
				}
			}
			hasTable && s.push('</table>');
			s = s.join("");
			infoDiv.html(s.replace(/\n/g, '<br>'));
		}

		var isEnable = false;

		function execFunc(fdiv, signal) {
			if (!(isEnable = (fdiv != undefined))) {
				return;
			}
			if (/^scr/.exec(signal)) {
				return;
			}
			fdiv.empty().append(infoDiv.unbind('click').click(function(e) {
				infoClick(times_stats, timesAt, e);
			}));
			updateInfo();
		}

		$(function() {
			if (typeof tools != "undefined") {
				tools.regTool('stats', TOOLS_STATS, execFunc);
			}
		});

		return {
			update: updateInfo
		}
	})();

	function timeAtDim(dim, idx) {
		var curTime = times[idx][0];
		if (curTime[0] == -1 || curTime.length <= dim) {
			return -1;
		}
		var ret = dim == 0 ?
			(curTime[0] + curTime[1]) :
			(curTime[curTime.length - dim] - (curTime[curTime.length - dim + 1] || 0));
		return roundMilli * ~~(ret / roundMilli);
	}

	var timeAt = timeAtDim.bind(undefined, 0);

	function timesAt(idx) {
		return times[idx];
	}

	var distribution = (function() {
		var div = $('<div />');

		var isEnable = false;

		var diffValues = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

		function updateDistribution() {
			if (!isEnable) {
				return;
			}
			div.empty();
			var data = times_stats.getMinMaxInt();
			if (!data) {
				return;
			}
			var max = data[0],
				min = data[1],
				diff = data[2];
			max = ~~(max / diff);
			min = ~~(min / diff);
			var dis = {};
			var keep = {};
			var cntmax = 0;
			keep[max + 1] = 0;
			for (var i = 0; i < times.length; i++) {
				var value = timeAt(i);
				if (value != -1) {
					var cur = ~~(value / diff);
					dis[cur] = (dis[cur] || 0) + 1;
					cntmax = Math.max(dis[cur], cntmax);
					keep[cur] = i + 1;
				} else {
					keep[max + 1] = i + 1;
				}
			}
			for (var i = max; i > min; i--) {
				keep[i] = Math.max(keep[i + 1], keep[i] || 0);
			}
			var str = [];
			var cumDis = 0;
			var pattern = diff >= 1000 ? /[^\.]+(?=\.)/ : /[^\.]+\.[\d]/;
			var lablen = kpretty(max * diff).match(pattern)[0].length;
			for (var i = min; i <= max; i++) {
				var label = kpretty(i * diff).match(pattern)[0];
				var label2 = kpretty((i + 1) * diff).match(pattern)[0];
				dis[i] = dis[i] || 0;
				cumDis += dis[i];
				label = mathlib.valuedArray(lablen - label.length, '&nbsp;').join('') + label;
				label2 = mathlib.valuedArray(lablen - label2.length, '&nbsp;').join('') + label2;
				str.push('<tr><td>' + label + '+</td><td><span class="cntbar" style="width: ' + dis[i] / cntmax * 5 + 'em;">' + dis[i] + '</span></td><td>&nbsp;&lt;' + label2 + '</td><td><span class="cntbar" style="width: ' + cumDis / times.length * 5 + 'em; white-space: nowrap;">' + (times.length - keep[i + 1]) + '/' + cumDis + '</span></td></tr>');
			}
			div.html('<table style="border:none;">' + str.join('') + '</table>');
		}

		function execFunc(fdiv, signal) {
			if (!(isEnable = (fdiv != undefined))) {
				return;
			}
			if (/^scr/.exec(signal)) {
				return;
			}
			fdiv.empty().append(div);
			updateDistribution();
		}

		$(function() {
			if (typeof tools != "undefined") {
				kernel.regListener('distribution', 'property', function(signal, value) {
					if (value[0] == 'disPrec') {
						updateDistribution();
					}
				}, /^disPrec$/);
				kernel.regProp('tools', 'disPrec', 1, STATS_PREC, ['a', ['a', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], STATS_PREC_STR.split('|')], 1);
				tools.regTool('distribution', TOOLS_DISTRIBUTION, execFunc);
			}
		});

		return {
			update: updateDistribution
		}
	})();

	var trend = (function() {
		var canvas = $('<canvas />'), ctx;

		var isEnable = false;

		var offx = 35,
			offy = 25;
		var width, height;

		function updateTrend() {
			if (!isEnable) {
				return;
			}
			if (!canvas[0].getContext) {
				return;
			}
			ctx = canvas[0].getContext('2d');
			var imgSize = kernel.getProp('imgSize') / 10;
			width = 50;
			canvas.width(10 * imgSize * 1.2 + 'em');
			canvas.height(5 * imgSize * 1.2 + 'em');

			canvas.attr('width', 10 * width + 1);
			canvas.attr('height', 5 * width + 5);

			height = 5 * width;
			width = 10 * width;

			ctx.lineWidth = 2;

			ctx.font = '12pt Arial';
			ctx.fillText("time", 50, 13);
			ctx.strokeStyle = '#888'; ctx.beginPath(); ctx.moveTo(90, 7); ctx.lineTo(150, 7); ctx.stroke();
			ctx.fillText((stat1 > 0 ? "ao" : "mo") + len1, 200, 13);
			ctx.strokeStyle = '#f00'; ctx.beginPath(); ctx.moveTo(240, 7); ctx.lineTo(300, 7); ctx.stroke();
			ctx.fillText((stat2 > 0 ? "ao" : "mo") + len2, 350, 13);
			ctx.strokeStyle = '#00f'; ctx.beginPath(); ctx.moveTo(390, 7); ctx.lineTo(450, 7); ctx.stroke();

			var data = times_stats.getMinMaxInt();
			if (!data) {
				return;
			}

			var diff = data[2];
			var plotmax = Math.ceil(data[0] / diff) * diff;
			var plotmin = ~~(data[1] / diff) * diff;
			var ploth = plotmax - plotmin;
			var pattern = diff >= 1000 ? /[^\.]+(?=\.)/ : /[^\.]+\.[\d]/;

			fill([0, 1, 1, 0, 0], [0, 0, 1, 1, 0], '#fff');

			ctx.fillStyle = '#000';
			ctx.strokeStyle = '#ccc';
			ctx.lineWidth = 1;
			ctx.textAlign = 'right';
			for (var i = plotmin; i <= plotmax; i += diff) {
				plot([0, 1], [(i - plotmin) / ploth, (i - plotmin) / ploth], '#ccc');

				var label = kpretty(i).match(pattern)[0];
				ctx.fillText(label, offx - 5, (plotmax - i) / ploth * (height - offy) + offy + 5);
			}

			ctx.lineWidth = 2;
			var x, y;
			if (times.length > 1) {
				x = []; y = [];
				for (var i = 0; i < times.length; i++) {
					var t = timeAt(i);
					if (t != -1) {
						x.push(i / (times.length - 1));
						y.push(Math.max(0, Math.min(1, (t - plotmin) / ploth)));
					}
				}
				plot(x, y, '#888');
			}
			if (times.length > len1) {
				x = []; y = [];
				var ao5 = times_stats.runAvgMean(0, times.length, len1, stat1 > 0 ? undefined : 0);
				for (var i = 0; i < ao5.length; i++) {
					if (ao5[i][0] != -1) {
						x.push((i + len1 - 1) / (times.length - 1));
						y.push(Math.max(0, Math.min(1, (ao5[i][0] - plotmin) / ploth)));
					}
				}
				plot(x, y, '#f00');
			}
			if (times.length > len2) {
				x = []; y = [];
				var ao12 = times_stats.runAvgMean(0, times.length, len2, stat2 > 0 ? undefined : 0);
				for (var i = 0; i < ao12.length; i++) {
					if (ao12[i][0] != -1) {
						x.push((i + len2 - 1) / (times.length - 1));
						y.push(Math.max(0, Math.min(1, (ao12[i][0] - plotmin) / ploth)));
					}
				}
				plot(x, y, '#00f');
			}

			plot([0, 1, 1, 0, 0], [0, 0, 1, 1, 0], '#000');
		}

		function plot(x, y, color) {
			ctx.strokeStyle = color;
			ctx.beginPath();
			ctx.moveTo(x[0] * (width - offx) + offx, (1 - y[0]) * (height - offy) + offy);
			for (var i = 1; i < x.length; i++) {
				ctx.lineTo(x[i] * (width - offx) + offx, (1 - y[i]) * (height - offy) + offy);
			}
			ctx.stroke();
			ctx.closePath();
		}

		function fill(x, y, color) {
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.moveTo(x[0] * (width - offx) + offx, (1 - y[0]) * (height - offy) + offy);
			for (var i = 1; i < x.length; i++) {
				ctx.lineTo(x[i] * (width - offx) + offx, (1 - y[i]) * (height - offy) + offy);
			}
			ctx.fill();
			ctx.closePath();
		}

		function execFunc(fdiv, signal) {
			if (!(isEnable = (fdiv != undefined))) {
				return;
			}
			if (/^scr/.exec(signal)) {
				return;
			}
			fdiv.empty().append(canvas);
			updateTrend();
		}

		$(function() {
			if (typeof tools != "undefined") {
				kernel.regListener('trend', 'property', function(signal, value) {
					if (value[0] == 'disPrec') {
						updateTrend();
					}
				}, /^disPrec$/);
				if (canvas[0].getContext) {
					tools.regTool('trend', TOOLS_TREND, execFunc);;
				}
			}
		});

		return {
			update: updateTrend
		}
	})();


	var sessionManager = (function() {

		var sessionIdxMax = 15;
		var sessionIdxMin = 1;
		var sessionIdx = -1;

		var ssmgrDiv = $('<div />');
		var ssmgrTable = $('<table />').appendTo(ssmgrDiv).addClass('table ssmgr');
		var funcButton = $('<input type="button">').val('+');

		var sessionData;
		var ssSorted;

		var newSessionOption = $('<option />').val('new').html('New..');
		var delSessionOption = $('<option />').val('del').html('Delete..');
		var select = $('<select />').change(function() {
			kernel.blur();
			if (select.val() == 'new') {
				createSession(sessionIdxMax, false);
			} else if (select.val() == 'del') {
				if (!deleteSession(sessionIdx)) {
					select.val(sessionIdx);
				}
				return;
			} else {
				loadSession(~~select.val());
			}
		});

		function loadSession(ssidx) {
			sessionIdx = ssidx;
			kernel.setProp('session', sessionIdx);
			load();
			var curSessionData = sessionData[sessionIdx];
			var sessionOpts = curSessionData['opt'] || {};
			kernel.setSProps(sessionOpts);
			kernel.setProp('scrType', curSessionData['scr'], 'session');
			kernel.setProp('phases', curSessionData['phases'], 'session');
			fixSessionSelect();
		}

		function fixSessionData() {
			for (var i = 1; i <= sessionIdxMax; i++) {
				sessionData[i] = sessionData[i] || {
					'name': (JSON.parse(kernel.getProp('sessionName') || '{}'))[i] || i,
					'scr': (JSON.parse(kernel.getProp('sessionScr') || '{}'))[i] || '333',
					'phases': 1,
					'opt': {}
				};
				sessionData[i]['rank'] = sessionData[i]['rank'] || i;
			}
			fixRank();
		}

		function fixSessionSelect() {
			fixSessionData();
			select.empty();
			for (var i = 0; i < ssSorted.length; i++) {
				select.append($('<option />').val(ssSorted[i]).html(sessionData[ssSorted[i]]['name']));
			}
			select.append(newSessionOption, delSessionOption);
			select.val(sessionIdx);
		}

		function fixRank() {
			ssSorted = [];
			for (var i = sessionIdxMin; i <= sessionIdxMax; i++) {
				ssSorted.push(i);
			}
			ssSorted.sort(function(a, b) {
				return sessionData[a]['rank'] - sessionData[b]['rank']
			});
			for (var i = 0; i < ssSorted.length; i++) {
				sessionData[ssSorted[i]]['rank'] = i + 1;
			}
			kernel.setProp('sessionData', JSON.stringify(sessionData));
		}

		function sessionIdent(idx) {
			return sessionData[idx]['rank'] + '-' + sessionData[idx]['name'];
		}

		function initNewSession(rank, copy) {
			if (!$.isNumeric(rank)) {
				rank = (sessionData[sessionIdx] || {})['rank'] || sessionIdxMax;
			}
			sessionIdx = ++sessionIdxMax;
			var curDate = new Date();
			var newName = (curDate.getMonth() + 1) + "." + curDate.getDate() + ' ' + curScrType;

			kernel.setProp('sessionN', sessionIdxMax);
			var prevData = sessionData[ssSorted[rank - 1]] || {};
			if (copy === undefined || copy) {
				sessionData[sessionIdx] = {
					'name': prevData['name'] || newName,
					'scr': prevData['scr'] || curScrType,
					'phases': prevData['phases'] || 1,
					'opt': JSON.parse(JSON.stringify(prevData['opt'] || {})),
					'rank': rank + 0.5
				};
			} else {
				sessionData[sessionIdx] = {
					'name': newName,
					'scr': curScrType,
					'phases': 1,
					'opt': kernel.getSProps(),
					'rank': rank + 0.5
				};
			}
			fixSessionSelect();
		}

		function createSession(rank, copy) {
			initNewSession(rank, copy);
			times = [];
			times_stats.reset(times.length);
			save();
			loadSession(sessionIdx);
			kernel.blur();

			if (kernel.getProp('imrename')) {
				renameSession(sessionIdx, true);
			}
		}

		function doSessionDeletion(ssidx) {
			// if not the last session, then swap to last session
			if (ssidx != sessionIdxMax) {
				sessionData[ssidx] = sessionData[sessionIdxMax];
			}
			delete sessionData[sessionIdxMax];
			storage.del(ssidx, sessionIdxMax);

			sessionIdxMax--;
			kernel.setProp('sessionN', sessionIdxMax);
			kernel.setProp('sessionData', JSON.stringify(sessionData));
			if (sessionIdxMax == 0) {
				createSession();
			} else if (sessionIdx == ssidx) {
				kernel.setProp('session', 1);
			} else if (sessionIdx == sessionIdxMax + 1) {
				loadSession(ssidx);
			}
		}

		function deleteSession(ssidx) {
			if (('stat' in sessionData[ssidx] ? sessionData[ssidx]['stat'][0] : 1) != 0 &&
				!confirm(STATS_CFM_DELSS.replace('%s', sessionIdent(ssidx)))) {
				return false;
			}
			doSessionDeletion(ssidx);
			return true;
		}

		function clearSession() {
			if (!confirm(STATS_CFM_RESET)) {
				return;
			}
			times = [];
			times_stats.reset();
			save();
			updateTable(false);
			kernel.blur();
		}

		function renameSession(ssidx, isCreate) {
			if (ssidx === undefined) {
				ssidx = sessionIdx;
			}
			var sName = prompt(isCreate ? STATS_SESSION_NAMEC : STATS_SESSION_NAME, sessionData[ssidx]['name']);
			if (sName != null) {
				sName = $('<div/>').text(sName).html();
				sessionData[ssidx]['name'] = sName;
				kernel.setProp('sessionData', JSON.stringify(sessionData));
			}
		}

		function sessionLoaded(sessionIdx, timesNew) {
			times = timesNew;
			times_stats.reset(times.length);
			updateTable(false);
			sessionData[sessionIdx]['stat'] = [times.length].concat(times_stats.getAllStats());
			sessionData[sessionIdx]['date'] = [(times[0] || [])[3], (times[times.length - 1] || [])[3]];
			kernel.setProp('sessionData', JSON.stringify(sessionData));
			if (kernel.isDialogShown('ssmgr')) {
				genMgrTable();
			}
			kernel.pushSignal('session', 'load');
		}

		function load() {
			storage.get(sessionIdx, sessionLoaded.bind(undefined, sessionIdx));
		}

		function save(startIdx) {
			sessionData[sessionIdx]['stat'] = [times.length].concat(times_stats.getAllStats());
			sessionData[sessionIdx]['date'] = [(times[0] || [])[3], (times[times.length - 1] || [])[3]];
			kernel.setProp('sessionData', JSON.stringify(sessionData));
			storage.set(sessionIdx, times, undefined, startIdx);
		}

		function mgrClick(e) {
			var target = $(e.target);
			if (!target.is('td, th, select') || !target.hasClass('click') && !target.is('select')) {
				return;
			}
			var row = target.parent();
			while (!row.is('tr')) {
				row = row.parent();
			}
			var child = row.children();
			if (child.length < 5) {
				child = row.prev().children();
			}
			var rank = ~~child.first().html().replace(/-.*$/, "");
			var idx = ssSorted[rank - 1];
			switch (target.attr('data') || target.val()) {
				case 'r':
					renameSession(idx);
					break;
				case 'u':
					if (rank != 1) {
						sessionData[idx]['rank']--;
						sessionData[ssSorted[rank - 2]]['rank']++;
						kernel.setProp('sessionData', JSON.stringify(sessionData));
					}
					break;
				case 'd': //swap
					if (rank != ssSorted.length) {
						sessionData[idx]['rank']++;
						sessionData[ssSorted[rank]]['rank']--;
						kernel.setProp('sessionData', JSON.stringify(sessionData));
					}
					break;
				case 's':
					loadSession(idx);
					break;
				case '+':
					createSession(rank);
					break;
				case 'x': //delete session
					deleteSession(idx);
					break;
				case 'm': //append current session to
					mergeSessionTo(idx);
					break;
				case 'p': //split current session
					splitSession();
					break;
				case 'e':
					expandRankGroup(target.parent());
					return;
				case 'g':
					byGroup = false;
					break;
				case 'gn':
					byGroup = 'name';
					break;
				case 'gs':
					byGroup = 'scr';
					break;
				case 'v':
					storage.get(idx, function(newTimes) {
						exportCSV(new TimeStat([], newTimes.length, function(times, idx) {
							return (times[idx][0][0] == -1) ? -1 : (~~((times[idx][0][0] + times[idx][0][1]) / roundMilli)) * roundMilli;
						}.bind(undefined, newTimes), dnfsort), function(times, idx) {
							return times[idx];
						}.bind(undefined, newTimes), 0, newTimes.length);
					});
					break;
				default:
					return;
			}
			kernel.blur();
			fixSessionSelect();
			genMgrTable();
		}

		function splitSession() {
			var n_split = prompt(STATS_PROMPTSPL.replace('%s', sessionIdent(sessionIdx)), ~~(times.length / 2));
			if (n_split == null) {
				return;
			}
			n_split = ~~n_split;
			if (n_split < 1 || n_split > times.length - 1) {
				alert(STATS_ALERTSPL);
				return;
			}
			var curSessionIdx = sessionIdx;
			var targetTimes = times.slice(-n_split);
			initNewSession();
			storage.set(sessionIdx, targetTimes, function() {
				sessionIdx = curSessionIdx;
				times = times.slice(0, -n_split);
				times_stats.reset();
				save();
				sessionLoaded(sessionIdx, times);
			});
		}

		function mergeSessionTo(idx) {
			if (sessionIdx == idx || !confirm(STATS_ALERTMG.replace('%f', sessionIdent(sessionIdx)).replace('%t', sessionIdent(idx)))) {
				return;
			}
			var prevSession = sessionIdx;
			storage.get(idx, function(timesNew) {
				Array.prototype.push.apply(timesNew, times);
				storage.set(idx, timesNew, function() {
					delete sessionData[idx]['stat'];
					sessionData[sessionIdx]['date'] = [(timesNew[0] || [])[3], (timesNew[timesNew.length - 1] || [])[3]];
					kernel.setProp('sessionData', JSON.stringify(sessionData));
					loadSession(idx);
					doSessionDeletion(prevSession);
				});
			})
		}

		function getMgrRowAtRank(rank) {
			var idx = ssSorted[rank - 1];
			var ssData = sessionData[idx];
			var ssStat = ['?/?', '?'];
			if ('stat' in ssData) {
				var s = ssData['stat'];
				ssStat[0] = (s[0] - s[1]) + '/' + s[0];
				ssStat[1] = kpround(s[2]);
			}
			var ops = STATS_SSMGR_OPS.split('|');
			var sel = '<select>' +
				'<option value="">...</option>' +
				'<option value="r">' + ops[0] + '</option>' +
				'<option value="+">' + ops[1] + '</option>' +
				'<option value="' + (idx == sessionIdx ? ('p">' + ops[2]) : ('m">' + ops[3])) + '</option>' +
				'<option value="x">' + ops[4] + '</option>' +
				'<option value="v">' + STATS_EXPORTCSV + '</option>' +
				'</select>';
			var uClk = rank == 1 ? '<td></td>' : '<td class="click" data="u">&#8593;</td>';
			var dClk = rank == ssSorted.length ? '<td></td>' : '<td class="click" data="d">&#8595;</td>';
			var scrTd = '<td>' + scramble.getTypeName(ssData['scr']) + '</td>';
			var ssTd0 = '<td>' + ssStat[0] + '</td>';
			var ssTd1 = '<td>' + ssStat[1] + '</td>';
			var dateVal = mathlib.time2str((sessionData[idx]['date'] || [])[1], '%Y-%M-%D');
			return '<tr class="' + (idx == sessionIdx ? 'selected mhide' : 'mhide') + '">' +
				'<td class="click" data="s">' + rank + '-' + ssData['name'] + (idx == sessionIdx ? '*' : '') + '</td>' +
				ssTd0 + ssTd1 +
				'<td>' + dateVal + '</td>' +
				scrTd +
				'<td>' + ssData['phases'] + '</td>' +
				uClk + dClk +
				'<td class="seltd">' + sel + '</td>' +
				'</tr>' +

				'<tr class="' + (idx == sessionIdx ? 'selected ' : '') + 'mshow t">' +
				'<td class="click" data="s" rowspan=2>' + rank + '-' + ssData['name'] + (idx == sessionIdx ? '*' : '') + '</td>' +
				ssTd0 + scrTd + uClk + dClk +
				'</tr>' +
				'<tr class="' + (idx == sessionIdx ? 'selected ' : '') + 'mshow b">' +
				ssTd1 +
				'<td>' + dateVal + '&nbsp;' + ssData['phases'] + 'P.</td>' +
				'<td class="seltd" colspan=2>' + sel + '</td>' +
				'</tr>';
		}

		function getMgrRowAtGroup(group) {
			var ssData = sessionData[ssSorted[group[0]]];
			var isInGroup = false;
			var ssNames = [];
			for (var i = 0; i < group.length; i++) {
				var idx = ssSorted[group[i]];
				isInGroup = isInGroup || sessionIdx == idx;
				ssNames.push(sessionData[idx]['name'] + '(' + scramble.getTypeName(sessionData[idx]['scr']) + ')');
			}
			ssNames = ssNames.join(', ');
			if (ssNames.length > 45) {
				ssNames = ssNames.slice(0, 42) + '...';
			}
			return '<tr' + (isInGroup ? ' class="selected"' : '') + '>' +
				'<td class="click" data="e" colspan=9 style="text-align:left;">' +
				(isInGroup ? '*' : '') + '[+] ' + group.length + ' session(s): ' + ssNames + '</td></tr>';
		}

		function expandRankGroup(curTr) {
			for (var elem = curTr.next(); elem.is(":hidden"); elem = elem.next()) {
				elem.css('display', '');
			}
			curTr.remove();
		}

		var byGroup = false;

		function genMgrTable() {
			fixRank();
			ssmgrTable.empty().append(
				'<tr class="mhide"><th class="click" data=' + (byGroup == 'name' ? '"g">[+]' : '"gn">[-]') + ' ' + STATS_SSMGR_NAME + '</th><th>' +
				STATS_SOLVE + '</th><th>' + STATS_AVG +
				'</th><th>' + STATS_DATE +
				'</th><th class="click" data=' + (byGroup == 'scr' ? '"g">[+]' : '"gs">[-]') + ' ' + SCRAMBLE_SCRAMBLE +
				'</th><th>P.</th><th colspan=3>OP</th></tr>' +
				'<tr class="mshow t"><th rowspan=2 class="click" data=' + (byGroup == 'name' ? '"g">[+]' : '"gn">[-]') + ' ' + STATS_SSMGR_NAME + '</th><th>' +
				STATS_SOLVE + '</th><th class="click" data=' + (byGroup == 'scr' ? '"g">[+]' : '"gs">[-]') + ' ' + SCRAMBLE_SCRAMBLE +
				'</th><th colspan=2 rowspan=2>OP</th></tr>' +
				'<tr class="mshow b"><th>' + STATS_AVG + '</th><th>' + STATS_DATE + ' & P.</th></tr>'
			);

			var groups = [];
			var gscr = NaN;
			for (var i = 0; i < ssSorted.length; i++) {
				var ssData = sessionData[ssSorted[i]];
				if (byGroup && ssData[byGroup] == gscr) {
					groups[groups.length - 1].push(i);
				} else {
					groups.push([i]);
					gscr = ssData[byGroup];
				}
			}
			for (var i = 0; i < groups.length; i++) {
				if (groups[i].length == 1) {
					ssmgrTable.append(getMgrRowAtRank(groups[i][0] + 1));
				} else {
					ssmgrTable.append(getMgrRowAtGroup(groups[i]));
					for (var j = 0; j < groups[i].length; j++) {
						ssmgrTable.append($(getMgrRowAtRank(groups[i][j] + 1)).hide());
					}
				}
			}
			ssmgrTable.unbind('click').click(mgrClick).unbind('change').change(mgrClick);
		}

		function showMgrTable() {
			genMgrTable();
			kernel.showDialog([ssmgrDiv, 0, undefined, 0, [STATS_SSMGR_ORDER, function() {
				if (!confirm(STATS_SSMGR_ODCFM)) {
					return false;
				}
				var ssSorted = [];
				for (var i = sessionIdxMin; i <= sessionIdxMax; i++) {
					ssSorted.push(i);
				}
				ssSorted.sort(function(a, b) {
					var idxa = scramble.getTypeIdx(sessionData[a]['scr']);
					var idxb = scramble.getTypeIdx(sessionData[b]['scr']);
					return idxa == idxb ? (sessionData[a]['rank'] - sessionData[b]['rank']) : (idxa - idxb);
				});
				for (var i = 0; i < ssSorted.length; i++) {
					sessionData[ssSorted[i]]['rank'] = i + 1;
				}
				fixRank();
				fixSessionSelect();
				genMgrTable();
				return false;
			}]], 'ssmgr', STATS_SSMGR_TITLE);
		}

		function procSignal(signal, value) {
			if (signal == 'property') {
				if (value[2] != 'set' && value[2] != 'session' && !value[0].startsWith('session')) {
					sessionData[sessionIdx]['opt'] = kernel.getSProps();
					kernel.setProp('sessionData', JSON.stringify(sessionData));
				}
				if (value[0] == 'session' && ~~value[1] != sessionIdx) {
					loadSession(value[1]);
				} else if (value[0] == 'sessionData') {
					sessionData = JSON.parse(value[1]);
					fixSessionSelect();
				} else if (value[0] == 'scrType' || value[0] == 'phases') {
					if (value[0] == 'scrType') {
						curScrType = value[1];
						if (sessionData[sessionIdx]['scr'] != value[1] && kernel.getProp('scr2ss')) {
							createSession(undefined, false);
						} else {
							sessionData[sessionIdx]['scr'] = value[1];
						}
					} else if (value[0] == 'phases') {
						sessionData[sessionIdx]['phases'] = value[1];
					}
					kernel.setProp('sessionData', JSON.stringify(sessionData));
				} else if (value[0] == 'statclr') {
					if (value[1]) {
						funcButton.val('X').unbind('click').click(clearSession);
					} else {
						funcButton.val('+').unbind('click').click(createSession);
					}
				}
			} else if (signal == 'ctrl' && value[0] == 'stats') {
				var rank = sessionData[sessionIdx]['rank'];
				if (value[1] == '+' && rank < sessionIdxMax) {
					kernel.setProp('session', ssSorted[rank]);
				} else if (value[1] == '-' && rank > sessionIdxMin) {
					kernel.setProp('session', ssSorted[rank - 2]);
				}
			}
		}

		function importSessions(data) {
			if (!data || data.length == 0) {
				return;
			}
			var currentSessionIdx = sessionIdx;
			for (var i = 0; i < data.length; i++) {
				//session = {'name': name, 'scr': scr, 'phases': phases, 'times': times}
				var sessionDetail = data[i];
				sessionIdx  = ++sessionIdxMax;
				sessionData[sessionIdx] = {
					'name': sessionDetail['name'] || sessionIdx,
					'scr': sessionDetail['scr'] || '333',
					'phases': sessionDetail['phases'] || 1,
					'opt': kernel.getSProps(),
					'rank': sessionIdxMax
				};
				kernel.setProp('sessionN', sessionIdxMax);
				times = sessionDetail['times'];
				times_stats.reset(times.length);
				save();
			}
			fixSessionSelect();
			loadSession(currentSessionIdx);
			showMgrTable();
			logohint.push('Import %d session(s)'.replace('%d', data.length));
			return data.length;
		}

		function rank2idx(rank) {
			return ssSorted[rank - 1];
		}

		$(function() {
			kernel.regListener('ssmgr', 'property', procSignal);
			kernel.regListener('ssmgr', 'ctrl', procSignal, /^stats$/);
			kernel.regProp('stats', 'sessionN', ~5, 'Number of Sessions', [15]);
			kernel.regProp('stats', 'sessionData', ~5, 'Session Data', ['{}']);
			kernel.regProp('stats', 'session', ~5, 'Current Session Index', [1]);

			sessionIdxMax = kernel.getProp('sessionN');
			sessionData = JSON.parse(kernel.getProp('sessionData'));
			fixSessionSelect();
			kernel.setProp('sessionData', JSON.stringify(sessionData));
		});

		return {
			getSelect: function() {
				return select;
			},
			showMgrTable: showMgrTable,
			importSessions: importSessions,
			getButton: function() {
				return funcButton;
			},
			rank2idx: rank2idx,
			load: load,
			save: save
		}

	})();

	function clearText() {
		stext.val('');
	}

	function getStats(times_stats, timesAt, title) {
		var theStats = times_stats.getAllStats();
		var numdnf = theStats[0];
		var sessionavg = times_stats.runAvgMean(0, times.length)[0];
		var sessionmean = theStats[1];
		var length = times_stats.timesLen;

		var tstr = "";
		if (kernel.getProp('printDate') && length > 2) {
			var tstart = timesAt(0);
			var tend = timesAt(length - 1);
			tstr = hlstr[11].replace("%s", mathlib.time2str(tstart && tstart[3]))
				.replace("%e", mathlib.time2str(tend && tend[3]));
			tstr = " (" + tstr + ")";
		}
		var s = [mathlib.time2str(+new Date / 1000, hlstr[3]) + tstr];
		s.push(hlstr[4].replace("%d", (length - numdnf) + "/" + length) + '\n');
		s.push(hlstr[5]);
		s.push('    ' + hlstr[0] + ": " + kpretty(times_stats.bestTime));
		s.push('    ' + hlstr[2] + ": " + kpretty(times_stats.worstTime) + "\n");
		for (var j = 0; j < avgSizes.length; j++) {
			var size = Math.abs(avgSizes[j]);
			if (length >= size) {
				s.push(hlstr[7 - (avgSizes[j] >>> 31)].replace("%mk", size));
				s.push('    ' + hlstr[1] + ": " + kpround(times_stats.lastAvg[j][0]) + " (σ = " + trim(times_stats.lastAvg[j][1], 2) + ")");
				s.push('    ' + hlstr[0] + ": " + kpround(times_stats.bestAvg[j][0]) + " (σ = " + trim(times_stats.bestAvg[j][1], 2) + ")\n");
			}
		}

		s.push(hlstr[8].replace("%v", kpround(sessionavg[0])).replace("%sgm", trim(sessionavg[1], 2)).replace(/[{}]/g, ""));
		s.push(hlstr[9].replace("%v", kpround(sessionmean) + '\n'));

		if (length != 0) {
			s.push(hlstr[10]);
			var timeStr = [];
			for (var i = 0; i < length; i++) {
				timeStr.push(detailTimeLine(i, timesAt(i), []));
			}
			timeStr = timeStr.join("").slice(0, -2);
			s.push(timeStr);
		}
		s = s.join("\n");
		stext.val(s);
		kernel.showDialog([stext, clearText, undefined, clearText, [STATS_EXPORTCSV, function() {
			exportCSV(times_stats, timesAt, 0, length);
			return false;
		}]], 'stats', title || STATS_CURSESSION);
		stext[0].select();
	}

	function dnfsort(a, b) {
		if (a == b) return 0;
		if (a < 0) return 1;
		if (b < 0) return -1;
		return a - b;
	}

	function trim(number, nDigits) {
		if (!number || number == Number.POSITIVE_INFINITY || number == Number.NEGATIVE_INFINITY) number = 0;
		var power = Math.pow(10, nDigits);
		var trimmed = "" + Math.round(number * power);
		while (trimmed.length < nDigits + 1) {
			trimmed = "0" + trimmed;
		}
		var len = trimmed.length;
		return trimmed.substr(0, len - nDigits) + "." + trimmed.substr(len - nDigits, nDigits);
	}

	function avgSizesStd(val) {
		val = val.split(/[\s,;]+/);
		var sizere = /([am])o(\d+)/;
		var avgSizesNew = [];
		for (var i = 0; i < val.length; i++) {
			var m = sizere.exec(val[i])
			if (!m) {
				return false;
			}
			avgSizesNew.push((m[1] == 'a' ? 1 : -1) * ~~m[2]);
		}
		avgSizesNew.sort(function(a, b) { return Math.abs(a) - Math.abs(b) });
		return avgSizesNew;
	}

	function updateTitleRow() {
		title.empty().append(
			'<th></th><th>' + STATS_TIME + '</th><th>' + (stat1 > 0 ? 'ao' : 'mo') + len1 + '</th><th>' + (stat2 > 0 ? 'ao' : 'mo') + len2 + '</th>'
		);
		if (curDim > 1) {
			for (var i = 0; i < curDim; i++) {
				title.append('<th>P.' + (i + 1) + '</th>');
			}
		}
	}

	function updateStatalU(statal) {
		var avgSizesNew = avgSizesStd(statal);
		if (!avgSizesNew) {
			kernel.setProp('statal', 'mo3 ao5 ao12 ao100');
			kernel.reprop();
			return;
		}
		avgSizes = avgSizesNew;
		times_stats = new TimeStat(avgSizes, times.length, timeAt, dnfsort);
		crossSessionStats.updateStatal(avgSizes);
		updateUtil();
	}

	var curScramble = "";

	var stat1, stat2, len1, len2;

	var curScrType = '333';
	var curPhases = 1;

	var roundMilli = 1;

	function procSignal(signal, value) {
		if (signal == 'time') {
			push(value);
		} else if (signal == 'scramble' || signal == 'scrambleX') {
			curScramble = value[1];
		} else if (signal == 'property') {
			if (/^(:?useMilli|timeFormat|stat[12][tl]|statinv)$/.exec(value[0])) {
				roundMilli = kernel.getProp('useMilli') ? 1 : 10;
				stat1 = [1, -1][~~kernel.getProp('stat1t')] * kernel.getProp('stat1l');
				stat2 = [1, -1][~~kernel.getProp('stat2t')] * kernel.getProp('stat2l');
				len1 = Math.abs(stat1);
				len2 = Math.abs(stat2);
				updateTable(false);
			} else if (value[0] == 'statsum') {
				updateSumTable();
			} else if (value[0] == 'statal') {
				var statal = value[1];
				if (statal == 'u') {
					if (value[2] == 'modify') {
						var input = prompt('Statistics Details', kernel.getProp('statalu') || 'mo3 ao5 ao12 ao100');
						if (/^\s*([am]o\d+[\s,;]*)+\s*$/.exec(input)) {
							kernel.setProp('statalu', input);
							statal = input;
						} else {
							if (input != null) {
								alert('INVALID VALUES!');
							}
							kernel.setProp('statal', 'mo3 ao5 ao12 ao100');
							kernel.reprop();
						}
					} else {
						statal = kernel.getProp('statalu');
					}
				}
				updateStatalU(statal);
			} else if (value[0] == 'statalu') {
				updateStatalU(value[1]);
			} else if (value[0] == 'trim') {
				times_stats.reset(times.length);
				crossSessionStats.updateStatal(avgSizes);
				updateUtil();
			} else if (value[0] == 'view') {
				resultsHeight();
			} else if (value[0] == 'statHide') {
				if (value[1]) {
						statOptDiv.hide();
				} else {
						statOptDiv.show();
				}
				updateTitleRow();
				updateSumTable();
			} else if (value[0] == 'wndStat') {
				resultsHeight();
			}
		} else if (signal == 'ctrl' && value[0] == 'stats') {
			if (value[1] == 'clr') {
				sessionManager.getButton().click();
			} else if (value[1] == 'undo') {
				floatCfm.delLast();
			} else if (value[1] == 'OK') {
				floatCfm.setCfm(0);
			} else if (value[1] == '+2') {
				floatCfm.setCfm(2000);
			} else if (value[1] == 'DNF') {
				floatCfm.setCfm(-1);
			}
		} else if (signal == 'ashow' && !value) {
			hideAll();
		} else if (signal == 'button' && value[0] == 'stats' && value[1]) {
			setTimeout(resultsHeight, 50);
		}
	}

	function resultsHeight() {
		if ($('html').hasClass('m')) {
			scrollDiv.height(Math.max(sumtableDiv.height(), avgRow.height() + title.height() * 2));
		} else if (scrollDiv[0].offsetParent != null) {
			scrollDiv.outerHeight(~~(div.height() - (statOptDiv.is(':hidden') ? 0 : statOptDiv.outerHeight()) - sumtableDiv.outerHeight() - 5));
		}
	}

	$(function() {
		kernel.regListener('stats', 'time', procSignal);
		kernel.regListener('stats', 'scramble', procSignal);
		kernel.regListener('stats', 'scrambleX', procSignal);
		kernel.regListener('stats', 'property', procSignal, /^(:?useMilli|timeFormat|stat(:?sum|[12][tl]|alu?|inv|Hide)|session(:?Data)?|scrType|phases|trim|view|wndStat)$/);
		kernel.regListener('stats', 'ctrl', procSignal, /^stats$/);
		kernel.regListener('stats', 'ashow', procSignal);
		kernel.regListener('stats', 'button', procSignal);

		kernel.regProp('stats', 'trim', 1, PROPERTY_TRIM, ['p5', ['1', 'p1', 'p5', 'p10', 'p20', 'm'], ['1', '1%', '5%', '10%', '20%', PROPERTY_TRIM_MED]]);
		kernel.regProp('stats', 'statsum', 0, PROPERTY_SUMMARY, [true]);
		kernel.regProp('stats', 'printScr', 0, PROPERTY_PRINTSCR, [true]);
		kernel.regProp('stats', 'printDate', 0, PROPERTY_PRINTDATE, [false]);
		kernel.regProp('stats', 'imrename', 0, PROPERTY_IMRENAME, [false]);
		kernel.regProp('stats', 'scr2ss', 0, PROPERTY_SCR2SS, [false]);
		kernel.regProp('stats', 'statinv', 0, PROPERTY_STATINV, [false]);
		kernel.regProp('stats', 'statclr', 0, STATS_STATCLR, [true]);
		kernel.regProp('stats', 'absidx', 0, STATS_ABSIDX, [false]);

		div.append(
			statOptDiv.append(
				$('<span class="click" />').html(STATS_SESSION).click(sessionManager.showMgrTable),
				sessionManager.getSelect(), sessionManager.getButton()),
			sumtableDiv.append(sumtable),
			$('<div class="stattl">').append(scrollDiv.append(table)));
		$(window).bind('resize', resultsHeight);
		table.append(title, avgRow);
		kernel.addWindow('stats', BUTTON_TIME_LIST, div, true, true, 4);
		scrollDiv.bind('scroll', function() {
			var elem = scrollDiv[0];
			if (elem.scrollHeight - elem.scrollTop < elem.clientHeight + 5 && !kernel.getProp('statinv')) {
				showAllRow.click();
			}
		});

		var stattl = STATS_TYPELEN.split('|');
		kernel.regProp('stats', 'stat1t', 1, stattl[0].replace('%d', 1), [0, [0, 1], stattl.slice(2)], 1);
		kernel.regProp('stats', 'stat1l', 2, stattl[1].replace('%d', 1), [5, 3, 1000], 1);
		kernel.regProp('stats', 'stat2t', 1, stattl[0].replace('%d', 2), [0, [0, 1], stattl.slice(2)], 1);
		kernel.regProp('stats', 'stat2l', 2, stattl[1].replace('%d', 2), [12, 3, 1000], 1);
		kernel.regProp('stats', 'statalu', 5, PROPERTY_STATALU, ['mo3 ao5 ao12 ao100'], 1);
		kernel.regProp('stats', 'statal', 1, PROPERTY_STATAL, ['mo3 ao5 ao12 ao100', ['mo3 ao5 ao12 ao100', 'mo3 ao5 ao12 ao25 ao50 ao100', 'mo3 ao5 ao12 ao25 ao50 ao100 ao200 ao500 ao1000 ao2000 ao5000 ao10000', 'u'],
			['mo3 ao5 ao12 ao100', 'mo3 ao5 ao12 ao25 ao50 ao100', 'mo3 ao5 ao12 ao25 ao50 ao100 ao200 ao500 ao1000 ao2000 ao5000 ao10000', 'Custom']
		], 1);
		kernel.regProp('stats', 'delmul', 0, PROPERTY_DELMUL, [true]);
		kernel.regProp('ui', 'statHide', ~0, 'Hide Session Title', [false]);
	});

	return {
		importSessions: sessionManager.importSessions
	}
}, [kernel.pretty, kernel.round, kernel.pround]);
