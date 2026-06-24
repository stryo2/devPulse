import { syncUserActivity }
from "./services/sync.service.js"

const run = async () => {

  const data = await syncUserActivity()

  console.log(
    JSON.stringify(data, null, 2)
  )

}

run()