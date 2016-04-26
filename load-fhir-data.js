window.GC = window.GC || {};

var param = function(i) {
  var r = new RegExp("[?&]" + i.replace(/[\[\]]/g, "\\$&") + "(=([^&#]*)|&|#|$)", "i");
  var e = r.exec(window.location.href);

  if (!e || !e[2])
    return null;

  return decodeURIComponent(e[2].replace(/\+/g, " "));
}

GC.get_data = function() {
  var dfd = $.Deferred();

//  FHIR.oauth2.ready(onReady, onError);

  function onError(){
    console.log("Loading error", arguments);
    dfd.reject({
      responseText: "Loading error. See console for details."
    });
  };
  patientID = sessionStorage.getItem('patient_id');
  patientID = (patientID) ? patientID : 'Patient-19454';
  var smart = FHIR.client({
    // patientId: '1137192',
    // serviceUrl: 'https://fhir-open-api-dstu2.smarthealthit.org',
    serviceUrl: 'http://52.72.172.54:8080/fhir/baseDstu2',
    // TODO better demo patient than 19454
    patientId: patientID,
    auth: {
      type: 'none'
    }
  })
  console.log('smart');
  console.log(smart);
  onReady(smart);

  function onReady(smart){

   // var hidePatientHeader = (smart.tokenResponse.need_patient_banner === false);
   // GC.Preferences.prop("hidePatientHeader", hidePatientHeader);

    var ptFetch = smart.patient.read();
    console.log('ptFetch');
    console.log(ptFetch);
    var vitalsFetch = smart.patient.api.fetchAll({type: "Observation", query: {code: {$or: ['3141-9', '8302-2', '8287-5', '39156-5', '18185-9', '37362-1', '11884-4']}}});
    console.log('vitalsFetch');
    console.log(vitalsFetch);
    var familyHistoryFetch = smart.patient.api.fetchAll({type: "FamilyMemberHistory"});
    console.log('familyHistoryFetch');
    console.log(familyHistoryFetch);

    $.when(ptFetch, vitalsFetch, familyHistoryFetch).done(onData);

    function onData(patient, vitals, familyHistories){
      console.log('patient');
      console.log(patient);
      console.log('vitals');
      console.log(vitals);
      console.log('familyHistories');
      console.log(familyHistories);
      var vitalsByCode = smart.byCode(vitals, 'code');

      var t0 = new Date().getTime();

      // Initialize an empty patient structure
      var p = {
        demographics: { },
        vitals:{
          lengthData: [],
          weightData: [],
          BMIData: [],
          headCData: []
        },
        boneAge: [],
        familyHistory: {
          father : {
            height: null,
            isBio : false
          },
          mother : {
            height: null,
            isBio : false
          }
        }
      };

      // For debugging/exploration, a global handle on the output
      console.log("Check out the parsed FHIR data: window.patient, window.vitalsByCode, window.familyHistories");
      window.patient = patient;
      window.vitalsByCode = vitalsByCode;
      window.familyHistories = familyHistories;

      var fname = patient.name[0].given.join(" ");
      var lname = patient.name[0].family.join(" ");
      p.demographics.name = fname + " " + lname;
      p.demographics.birthday = patient.birthDate;
      p.demographics.gender = patient.gender;

      var gestAge = vitalsByCode['18185-9'];
      if (gestAge === undefined) {
        //handle an alternate mapping of Gest Age used by Cerner
        gestAge = vitalsByCode['11884-4'];
      }
      if (gestAge && gestAge.length > 0) {
        var weeks = 0, qty = gestAge[0].valueString ?
          gestAge[0].valueString.value || '40W 0D' :
          gestAge[0].valueQuantity ?
            gestAge[0].valueQuantity.value || 40 :
            40;

        if (typeof qty == 'string') {
          qty.replace(/(\d+)([WD])\s*/gi, function(token, num, code) {
            num = parseFloat(num);
            if (code.toUpperCase() == 'D') {
              num /= 7;
            }
            weeks += num;
          });
        } else {
          weeks = qty;
        }

        p.demographics.gestationalAge = weeks;
        p.demographics.weeker = weeks;
      }

      var units = smart.units;
      process(vitalsByCode['3141-9'], units.kg, p.vitals.weightData);
      process(vitalsByCode['8302-2'],  units.cm,  p.vitals.lengthData);
      process(vitalsByCode['8287-5'],  units.cm,  p.vitals.headCData);
      process(vitalsByCode['39156-5'], units.any, p.vitals.BMIData);
      processBA(vitalsByCode['37362-1'], p.boneAge);

      function process(observationValues, toUnit, arr){
        observationValues && observationValues.forEach(function(v){
          arr.push({
            agemos: months(v.effectiveDateTime, patient.birthDate),
            value: toUnit(v.valueQuantity)
          })
        });
      };

      function processBA(boneAgeValues, arr){
        boneAgeValues && boneAgeValues.forEach(function(v){
          arr.push({
            date: v.effectiveDateTime,
            boneAgeMos: units.any(v.valueQuantity)
          })
        });
      };

      function months(d){
        return -1 * new XDate(d).diffMonths(new XDate(p.demographics.birthday));
      }

      $.each(familyHistories, function(index, fh){
        if (fh.resourceType === "FamilyMemberHistory") {
              var code = fh.relationship.coding[0].code;
              $.each(fh.extension || [], function(index, ext){
                if (ext.url === "http://fhir-registry.smarthealthit.org/StructureDefinition/family-history#height") {
                  var ht = units.cm(ext.valueQuantity);
                  var r = null;
                  if (code === 'FTH') {
                    r = p.familyHistory.father;
                  } else if (code === 'MTH') {
                    r = p.familyHistory.mother;
                  }
                  if (r) {
                    r.height = ht;
                    r.isBio = true;
                  }
                }
              });
        }
      });

      window.data = p;
      console.log("Check out the patient's growth data: window.data");
      dfd.resolve(p);
    }
  }

  return dfd.promise();
};
