import { scheduleJob } from 'node-schedule'
import updateVariants from '../routines/updateVariants'
import { performance } from 'perf_hooks'

const routines = [
  {
    schedule: process.env.UPDATE_VARIANTS_SCHEDULE,
    job: () => updateVariants(),
    name: "UPDATE_VARIANTS"
  }
]

export default function scheduler(){

  routines.forEach(routine => scheduleJob(routine.schedule, async () => {

    const startTime = performance.now()

    const response = await routine.job()

    const execTime = Math.round((performance.now() - startTime) * 100) / 100

    console.log({ routine: routine.name, response, execTime })

  }))
}