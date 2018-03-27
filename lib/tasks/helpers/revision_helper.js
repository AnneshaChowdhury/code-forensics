/*
 * code-forensics
 * Copyright (C) 2016-2018 Silvio Montanari
 * Distributed under the GNU General Public License v3.0
 * see http://www.gnu.org/licenses/gpl.html
 */

var moment = require('moment'),
    _      = require('lodash'),
    map    = require('through2-map'),
    utils  = require('../../utils'),
    vcs    = require('../../vcs'),
    pp     = require('../../parallel_processing');

module.exports = function(context) {
  var vcsClient = vcs.client(context.repository);

  this.revisionAnalysisStream = function(analyser) {
    var file = context.parameters.targetFile;
    var moduleRevisions = vcsClient.revisions(file, context.dateRange);

    if (moduleRevisions.length === 0) { throw new Error('No revisions data found'); }

    return pp.objectStreamCollector()
    .mergeAll(utils.arrays.arrayToFnFactory(moduleRevisions, function(revisionObj) {
      return vcsClient.showRevisionStream(revisionObj.revisionId, file)
      .pipe(analyser.sourceAnalysisStream(file))
      .pipe(map.obj(function(analysisResult) {
        return _.extend({ revision: revisionObj.revisionId, date: moment(revisionObj.date) }, analysisResult);
      }));
    }));
  };
};
