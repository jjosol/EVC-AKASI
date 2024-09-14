<script setup>

const router = useRouter()

onMounted(() => {
  router.replace({ path: '/login' })
})
</script>