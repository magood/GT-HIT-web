#!/bin/sh

#server="http://52.72.172.54:8080/fhir/baseDstu2"
#number="19179006"
number="5721fc4d0cf20e9addb273b9"
postnumber=$number
server="https://fhir-open-api-dstu2.smarthealthit.org"
#number="newrefreq"
#postnumber=""

echo "curl -X PUT --data-binary @$number.json -H 'Content-Type: application/json' $server/ReferralRequest/$postnumber"
