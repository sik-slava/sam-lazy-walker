# Walking through lazy-walker

## Assumptions
  - Single DynamoDb table contains 
    - Mappings between vehicles and handhelds
    - Location data reported from devices
  - Single vehicle contains single handheld
  - For simplicity, logic is triggered when vehicle reports its location
  - For simplicity, distance is analyzed based on latest reported locations from devices

## V1 - All in one
  - Single lambda doing all the having lifting
    - Subscribed to everything: `v1/gps/+/#`
    - Store all reported locations
    - Fetch handheld by vehicle
    - Fetch the latest location of handheld
    - Find distance between devices
    - Publish to SNS if distance > x

## V2 - Two Lambdas
Decouple storing data from logic by using dedicated lambda for writing to DynamoDb

  - One lambda subscribed to `v1/gps/+/#`  
    - Store all reported locations
  - Another lambda subscribed to `v1/gps/vehicle/#`
      - Fetch handheld by vehicle
      - Fetch the latest location of handheld
      - Find distance between devices
      - Publish to SNS if distance > x
