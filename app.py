import flask
from flask import Flask, render_template, redirect
from ocflib.account.utils import list_staff

import utils


app = Flask(__name__)
staff = list_staff()

@app.route('/')
def root():
    return redirect('/graph/slobo/')


@app.route('/graph/<user>/')
def chart_for_user(user):
    return render_template('timeseries.html', user=user, staff=staff)


# --------------------------------------------------


@app.route('/<user>/data/logins_over_time/')
def data_for_user(user):
    return flask.json.jsonify(utils.get_data(user))


@app.route('/staff_members/')
def get_staff():
    return flask.json.jsonify(staff)


if __name__ == '__main__':
    app.run()
