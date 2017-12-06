import datetime
from datetime import timezone
from collections import defaultdict

from ocflib.lab import stats


def get_data(user):
    """
    Generates a json blob of data for the passed user
    """
    cnx = stats.get_connection()
    cursor = cnx.cursor()
    query = """
            SELECT `start`, `end`
            FROM `staff_session_duration_public`
            WHERE `user` = %s
                AND `duration` IS NOT NULL
            ORDER BY start ASC"""
    cursor.execute(query, (user))
    cleaned = cursor.fetchall()

    if cleaned:
        step = datetime.timedelta(days=1)
        start_date = cleaned[0]['start'].replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end_date = datetime.datetime.today().replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        frequency = defaultdict(lambda: 0)

        for row in cleaned:
            start =row['start']
            start_0 = start.replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            end = row['end']
            end_0 = end.replace(
                hour=0, minute=0, second=0, microsecond=0
            )

            num_days = (end_0 - start_0).days
            for day_num in range(num_days + 1):
                day = start_0 + datetime.timedelta(days=day_num)

                effective_start = max(start, day)
                effective_end   = min(end, day + step)
                frequency[day] += (effective_end - effective_start).total_seconds() // 60

        # collect tuples
        cur_date = start_date
        freqs = []
        while cur_date <= end_date:
            freqs.append(frequency[cur_date])
            ts = cur_date.replace(tzinfo=timezone.utc).timestamp()
            cur_date += step

        cumu_freqs = freqs.copy()
        for i in range(1, len(cumu_freqs)):
            cumu_freqs[i] += cumu_freqs[i - 1]
    else:
        cumu_freqs = None
        freqs = None
        start_date = datetime.datetime.today()

    base_data = {
        "name" : user,
        "unit" : "minutes",
        "year" : start_date.year,
        "month": start_date.month - 1,
        "day"  : start_date.day,
    }

    return {
        "datasets": [
            {
                "data" : cumu_freqs,
                "title": 'Cumulative lab usage in minutes',
                "type" : "line",
                **base_data,
            },
            {
                "data" : freqs,
                'title': 'Daily lab usage in minutes',
                "type" : "line",
                **base_data,
            }
         ]
    }

