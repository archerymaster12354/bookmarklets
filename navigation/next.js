/**
 * Go to the next page. To do so, this bookmarklet will look:
 * - for <link rel="next"> or <a rel="next">
 * - for links whose text contains "Next", ">>", etc.
 *   e.g. <a href="/bla">Next</a>
 * - for links whose (or their parents') ID or class contains "next"
 * - at the URL to see if there is a date, and increases that
 * - at the URL to see if there is a number, and increases that
 * - for links whose next sibling's text contains "Next", ">>", etc.
 *   e.g. <a href="/bla">Whatever</a> »
 *
 * @title Next »
 * @todo Make month and day optional for URL-based dates.
 * @todo Support multiple locales and cases for URL-based months.
 */
(function next() {
	var symbols = '>> » → ⇒',
	    keywords = ('Next next Volgende volgende Prochain prochain' + symbols).split(' '),
	    symbols = symbols.split(' '),
	    identifiers = 'next nextArticle nextPost nextLink'.split(' '),
	    monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	    selectors, newUrl;

	/* Try links with @rel="next". */
	selectors = [
		'link[rel="next"][href], a[rel="next"][href]',
	];

	/* Look for tell-tale text content inside links. */
	keywords.forEach(function (text) {
		selectors.push('//a[@href][@href != "#"][contains(., "' + text + '")]');
	});

	/* Look for typical ID/class names on the links. */
	identifiers.forEach(function (idOrClass) {
		selectors.push('a#' + idOrClass);
		selectors.push('a.' + idOrClass);
	});

	/**
	 * Loop through the given selectors.
	 *
	 * @param array selectors
	 * @return string The matching selector's destination URL, if any.
	 */
	function processSelectors(selectors) {
		function getLastXPathResult(result) {
			return result.snapshotItem(result.snapshotLength - 1);
		}

		for (var link, i = 0; i < selectors.length; i++) {
			/* Prefer the last node because it is more likely to be a navigation link. 100% fact. */
			link = selectors[i].substring(0, 2) === '//'
				? getLastXPathResult(document.evaluate(selectors[i], document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null))
				: Array.prototype.slice.call(document.querySelectorAll(selectors[i])).pop();
			if (link) {
				window.console && console.log('Next »: Matching selector: ' + selectors[i] + '\nFound link: ', link);
				return link.href;
			}
		}
	}

	/* Check the "highly likely" selectors we have so far. */
	if ((newUrl = processSelectors(selectors))) {
		location = newUrl;
		return;
	}

	/* Check for a date in the URL. */
	var uri = location.pathname + location.search + location.hash, matches;
	var yearPattern = '20[0-9][0-9]',
	    monthPattern = monthNames.concat(['(?:0?[1-9])', '(?:1[012])']).join('|'),
	    dayPattern = '(?:' + ['3[01]', '[12][0-9]', '0?[1-9]'].join(')|(?:') + ')',
	    regexp = new RegExp('(.*?\\b)(' + yearPattern + ')([-/_.])(' + monthPattern + ')\\3(' + dayPattern + ')(.*)');
	if ((matches = uri.match(regexp))) {
		var prefix = matches[1], year = matches[2], separator = matches[3], month = matches[4], day = matches[5], suffix = matches[6];
		var newDate = new Date(Date.UTC(
			parseInt(year, 10),
			month.length === 3 ? monthNames.indexOf(month) : parseInt(month, 10) - 1,
			parseInt(day, 10)
		) + 24 * 60 * 60 * 1000);
		var newYear = newDate.getUTCFullYear(),
		    newMonth = month.length === 3 ? monthNames[newDate.getUTCMonth()] : newDate.getUTCMonth() + 1,
		    newDay = newDate.getUTCDate();
		if (newMonth < 10 && month.length === 2) {
			newMonth = '0' + newMonth;
		}
		if (newDay < 10 && day.length === 2) {
			newDay = '0' + newDay;
		}
		newUrl = prefix + newYear + separator + newMonth + separator + newDay + suffix;
		window.console && console.log('Next »: Matching date in URL: ', [year, month, day], '\nCalculated URL: ', newUrl);
		location = newUrl;
		return;
	}

	/* Check for a number in the URL. */
	if ((matches = uri.match(/(.*?)([0-9]+)([^0-9]*)$/))) {
		var number = parseInt(matches[2], 10), newNumber = number + 1;
		if (matches[2].substring(0, 1) === '0' && (newNumber + '').length < matches[2].length) {
			newNumber = (Math.pow(10, matches[2].length) + '').substring(1 + (newNumber + '').length) + newNumber;
		}
		newUrl = matches[1] + newNumber + matches[3];
		window.console && console.log('Next »: Matching number in URL; going from ', matches[2], ' to ', newNumber, '\nCalculated URL: ', newUrl);
		location = newUrl;
		return;
	}

	selectors = [];

	/* Look for tell-tale symbols next to links. */
	symbols.forEach(function (text) {
		selectors.push('//*[contains(text(), "' + text + '") and substring-after(text(), "' + text + '") = ""]//preceding-sibling::a');
	});

	/* Look for typical ID/class names on the links' parents. */
	identifiers.forEach(function (idOrClass) {
		selectors.push('#' + idOrClass + ' > a');
		selectors.push('.' + idOrClass + ' > a');
	});

	/* Now check the selectors we are less confident about. */
	if ((newUrl = processSelectors(selectors))) {
		location = newUrl;
		return;
	}

	/* Alert the user by flashing the title bar. */
	var numCycles = 0, originalTitle = document.title, icons = '◻ ◼'.split(' ');
	(function flash() {
		if (numCycles < 6) {
			document.title = icons[numCycles % icons.length] + ' No next page? ' + icons[(numCycles + 1) % icons.length];
			window.setTimeout(flash, 500);
		} else {
			document.title = originalTitle;
		}
		numCycles++;
	})();
})();