#!/bin/sh
# npm install html-minifier clean-css uglifyjs -g
mkdir -p build/css
mkdir -p build/js/charts
mkdir -p build/js/data
mkdir -p build/lib
mkdir -p build/node_modules/fhirclient
mkdir -p build/tests
cp ./about-dialog.html ./build/about-dialog.html
cp ./add_edit_dataentry.html ./build/add_edit_dataentry.html
cp ./annotations.html ./build/annotations.html
cp ./index.html ./build/index.html
cp ./launch.html ./build/launch.html
cp ./message-detail.html ./build/message-detail.html
cp ./print-charts.html ./build/print-charts.html
cp ./select-patient.html ./build/select-patient.html
cp ./settings-editor.html ./build/settings-editor.html
cp ./tests/index.html ./build/tests/index.html
cp ./tests/test-pointset-clip.html ./build/tests/test-pointset-clip.html
cp ./tests/test-pointset-smoothing.html ./build/tests/test-pointset-smoothing.html
cp -R ./fixtures ./build/fixtures
cp -R ./fonts ./build/fonts
cp -R ./img ./build/img
cp -R ./scripts ./build/scripts
cp -R ./tests ./build/tests
cp -R ./themes ./build/themes
cp ./GCCurveDataJSON.txt ./build/GCCurveDataJSON.txt
cp ./GCMenuItemsJSON.txt ./build/GCMenuItemsJSON.txt
cp ./LICENSE ./build/LICENSE
cp ./license.txt ./build/license.txt
cp ./img/gatech_logo_small.png ./build/favicon.ico
cleancss ./css/about-dialog.css > ./build/css/about-dialog.css
cleancss ./css/bootstrap-theme.css > ./build/css/bootstrap-theme.css
cleancss ./css/bootstrap.css > ./build/css/bootstrap.css
cleancss ./css/dataTables.bootstrap.css > ./build/css/dataTables.bootstrap.css
cleancss ./css/fixedHeader.bootstrap.css > ./build/css/fixedHeader.bootstrap.css
cleancss ./css/fixedHeader.dataTables.css > ./build/css/fixedHeader.dataTables.css
cleancss ./css/gc-pview.css > ./build/css/gc-pview.css
cleancss ./css/gc-pview2.css > ./build/css/gc-pview2.css
cleancss ./css/gc-screen.css > ./build/css/gc-screen.css
cleancss ./css/jquery.dataTables.css > ./build/css/jquery.dataTables.css
cleancss ./css/jquery.dataTables_themeroller.css > ./build/css/jquery.dataTables_themeroller.css
cleancss ./css/materialize.css > ./build/css/materialize.css
cleancss ./css/message-style.css > ./build/css/message-style.css
cleancss ./css/preferences-editor.css > ./build/css/preferences-editor.css
cleancss ./css/print.css > ./build/css/print.css
cleancss ./css/reset.css > ./build/css/reset.css
cleancss ./css/roboto.css > ./build/css/roboto.css
cleancss ./css/scroller.bootstrap.css > ./build/css/scroller.bootstrap.css
cleancss ./css/scroller.dataTables.css > ./build/css/scroller.dataTables.css
cleancss ./css/style.css > ./build/css/style.css
cleancss ./tests/resources/qunit.css > ./build/tests/resources/qunit.css
uglifyjs ./js/about-dialog.js > ./build/js/about-dialog.js
uglifyjs ./js/chart-pane.js > ./build/js/chart-pane.js
uglifyjs ./js/charts/body-mass-index-chart.js > ./build/js/charts/body-mass-index-chart.js
uglifyjs ./js/charts/chart-stack.js > ./build/js/charts/chart-stack.js
uglifyjs ./js/charts/chart.js > ./build/js/charts/chart.js
uglifyjs ./js/charts/head-chart.js > ./build/js/charts/head-chart.js
uglifyjs ./js/charts/length-chart.js > ./build/js/charts/length-chart.js
uglifyjs ./js/charts/mini_charts.js > ./build/js/charts/mini_charts.js
uglifyjs ./js/charts/percentile-chart.js > ./build/js/charts/percentile-chart.js
uglifyjs ./js/charts/weight-chart.js > ./build/js/charts/weight-chart.js
uglifyjs ./js/coord-allmessages-view.js > ./build/js/coord-allmessages-view.js
uglifyjs ./js/coord-map-view.js > ./build/js/coord-map-view.js
uglifyjs ./js/coord-message-view.js > ./build/js/coord-message-view.js
uglifyjs ./js/coord-patients-view.js > ./build/js/coord-patients-view.js
uglifyjs ./js/coord-psmessages-view.js > ./build/js/coord-psmessages-view.js
uglifyjs ./js/coord-question-view.js > ./build/js/coord-question-view.js
uglifyjs ./js/gc-app.js > ./build/js/gc-app.js
uglifyjs ./js/gc-boneage-calculator.js > ./build/js/gc-boneage-calculator.js
uglifyjs ./js/gc-chart-config.js > ./build/js/gc-chart-config.js
uglifyjs ./js/gc-chart.js > ./build/js/gc-chart.js
uglifyjs ./js/gc-charts-data.js > ./build/js/gc-charts-data.js
uglifyjs ./js/gc-grid-view.js > ./build/js/gc-grid-view.js
uglifyjs ./js/gc-model.js > ./build/js/gc-model.js
uglifyjs ./js/gc-parental-view.js > ./build/js/gc-parental-view.js
uglifyjs ./js/gc-pointset.js > ./build/js/gc-pointset.js
uglifyjs ./js/gc-sample-patients.js > ./build/js/gc-sample-patients.js
uglifyjs ./js/gc-smart-data.js > ./build/js/gc-smart-data.js
uglifyjs ./js/gc-statistics.js > ./build/js/gc-statistics.js
uglifyjs ./js/gc-style-generator.js > ./build/js/gc-style-generator.js
uglifyjs ./js/gc-translations.js > ./build/js/gc-translations.js
uglifyjs ./js/load.js > ./build/js/load.js
uglifyjs ./js/message-detail.js > ./build/js/message-detail.js
uglifyjs ./js/polyfills.js > ./build/js/polyfills.js
uglifyjs ./js/print2.js > ./build/js/print2.js
uglifyjs ./js/settings-editor.js > ./build/js/settings-editor.js
uglifyjs ./js/util.js > ./build/js/util.js
uglifyjs ./lib/bootstrap.js > ./build/lib/bootstrap.js
uglifyjs ./lib/dataTables.bootstrap.js > ./build/lib/dataTables.bootstrap.js
uglifyjs ./lib/dataTables.fixedHeader.js > ./build/lib/dataTables.fixedHeader.js
uglifyjs ./lib/datatables.js > ./build/lib/datatables.js
uglifyjs ./lib/dataTables.scroller.js > ./build/lib/dataTables.scroller.js
uglifyjs ./lib/jquery-1.12.2.js > ./build/lib/jquery-1.12.2.js
uglifyjs ./lib/jquery-migrate-1.3.0.js > ./build/lib/jquery-migrate-1.3.0.js
uglifyjs ./lib/jquery-ui-1.8.14.custom.min.js > ./build/lib/jquery-ui-1.8.14.custom.min.js
uglifyjs ./lib/jquery-ui-1.9.1.js > ./build/lib/jquery-ui-1.9.1.js
uglifyjs ./lib/jquery.dataTables.js > ./build/lib/jquery.dataTables.js
uglifyjs ./lib/jquery.js > ./build/lib/jquery.js
uglifyjs ./lib/materialize.js > ./build/lib/materialize.js
uglifyjs ./lib/moment.js > ./build/lib/moment.js
uglifyjs ./lib/raphael.js > ./build/lib/raphael.js
uglifyjs ./lib/xdate.js > ./build/lib/xdate.js
uglifyjs ./load-fhir-data.js > ./build/load-fhir-data.js
uglifyjs ./node_modules/fhirclient/fhir-client.js > ./build/node_modules/fhirclient/fhir-client.js
uglifyjs ./tests/resources/qunit.js > ./build/tests/resources/qunit.js
uglifyjs ./tests/test-pointset.js > ./build/tests/test-pointset.js
uglifyjs ./tests/test-utils.js > ./build/tests/test-utils.js
