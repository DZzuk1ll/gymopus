export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">隐私政策</h1>

      <div className="space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">
            我们收集的数据
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>健身画像信息（身高、体重、训练目标等）</li>
            <li>训练记录和训练计划</li>
            <li>饮食记录</li>
            <li>对话内容</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">
            我们不收集的数据
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>姓名、邮箱、手机号</li>
            <li>位置信息</li>
            <li>设备指纹</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">
            数据存储
          </h2>
          <p>所有数据存储在服务器数据库中，通过匿名 ID 关联。</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">
            第三方服务
          </h2>
          <p>
            对话内容会发送至用户选择的第三方 LLM API
            处理（如 DeepSeek、通义千问等），受对应服务商隐私政策约束。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">
            用户权利
          </h2>
          <p>
            你可以随时在设置页面删除全部个人数据。账户删除后数据立即清除。
          </p>
        </section>
      </div>
    </div>
  );
}
