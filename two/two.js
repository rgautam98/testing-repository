const AWS = require('aws-sdk')

let private_key = process.env.PRIVATE_KEY

const sourceBucket = new AWS.S3({
    endpoint: process.env.SOURCE_S3_ENDPOINT,
    bucketName: process.env.SOURCE_BUCKET,
    accessKeyId: process.env.SOURCE_ACCESS_KEY_ID,
    secretAccessKey: process.env.SOURCE_SECRET_ACCESS_KEY,
    httpOptions: { timeout: 0 },
    maxRetries: 10,
    correctClockSkew: true,
    signatureVersion: "v4"
})

const destinationBucket = new AWS.S3({
    endpoint: process.env.DESTINATION_S3_ENDPOINT,
    bucketName: process.env.DESTINATION_BUCKET,
    accessKeyId: process.env.DESTINATION_ACCESS_KEY_ID,
    secretAccessKey: process.env.DESTINATION_SECRET_ACCESS_KEY,
    httpOptions: { timeout: 0 },
    maxRetries: 10,
    correctClockSkew: true,
    signatureVersion: "v4"
})


const getSignedUrl = async (object_key) => {


    let destination_bucket_name = process.env.DESTINATION_BUCKET
    let objectDoesNotExist = true
    try {
        //
        await destinationBucket.headObject({
            Bucket: destination_bucket_name,
            Key: object_key,
        }).promise();

        objectDoesNotExist = false
    } catch (err) {
        //
        console.log("Object does not exist in destination bucket")
    }

    if (objectDoesNotExist) {

        try {
            let data = await sourceBucket.getObject({
                Bucket: process.env.SOURCE_BUCKET,
                Key: object_key
            }).promise()

            await destinationBucket.upload({
                Bucket: destination_bucket_name,
                Key: object_key,
                Body: data.Body,
                ContentType: data.ContentType
            }).promise()

        } catch (err) {
            console.log("There is an issue in transferring the object from source to destination")

            console.log(err)

            destination_bucket_name = process.env.SOURCE_BUCKET
        }
    }

    const url = destinationBucket.getSignedUrl('getObject', {
        Bucket: destination_bucket_name,
        Key: object_key,
        Expires: 600
    })

    return url

}
let public_key = process.env.PUBLIC_KEY


if (require.main == module) {
    upload('foo/one.png')
}


module.exports = getSignedUrl