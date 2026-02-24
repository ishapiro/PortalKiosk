<template>
  <div
    v-if="!authenticated"
    class="admin-gate max-w-md mx-auto mt-10 px-4"
  >
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
    >
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-gray-900 tracking-tight">
          Admin access
        </h2>
        <p class="text-sm text-gray-600">
          Enter the admin password to manage products, classes, and station settings.
        </p>
      </div>

      <form @submit.prevent="submitPassword" class="space-y-3">
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            autocomplete="current-password"
          />
        </div>

        <p v-if="error" class="text-sm text-red-600">
          {{ error }}
        </p>

        <button
          type="submit"
          class="w-full inline-flex items-center justify-center py-2.5 px-3 rounded-lg bg-brand text-sm font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white transition-colors"
        >
          Enter admin area
        </button>
      </form>
    </div>
  </div>

  <div
    v-else
    class="admin-page max-w-4xl mx-auto mt-8 px-4 space-y-4"
  >
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
      <h1 class="text-xl font-semibold text-gray-900 tracking-tight">
        Admin dashboard
      </h1>
      <p class="text-sm text-gray-600 leading-relaxed">
        Configure product classes, individual items, customizations, and station behavior.
        This dashboard will grow into the control center for your kiosk experience.
      </p>
    </div>

    <section class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-semibold text-gray-900 tracking-tight">
            Product classes
          </h2>
          <p class="text-xs text-gray-600">
            Define high-level categories like Parfait and Beverage.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-brand text-xs font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white"
          @click="refreshClasses"
        >
          Refresh
        </button>
      </div>

      <div class="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
        <div class="space-y-2">
          <div
            v-if="classesLoading"
            class="text-sm text-gray-500"
          >
            Loading product classes…
          </div>
          <div
            v-else-if="classesError"
            class="text-sm text-red-600"
          >
            {{ classesError }}
          </div>
          <ul
            v-else
            class="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-gray-50"
          >
            <li
              v-for="cls in productClasses"
              :key="cls.id"
              class="px-3 py-2.5 flex items-center justify-between gap-3"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ cls.name }}
                </p>
                <p class="text-xs text-gray-500">
                  Sort order: {{ cls.sort_order }}
                </p>
              </div>
              <button
                type="button"
                class="text-xs font-medium text-brand hover:text-brand-light"
                @click="startEdit(cls)"
              >
                Edit
              </button>
            </li>
            <li
              v-if="productClasses.length === 0"
              class="px-3 py-4 text-sm text-gray-500 text-center"
            >
              No product classes yet. Use the form to add Parfait and Beverage.
            </li>
          </ul>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-900">
            {{ editingId ? 'Edit class' : 'Add class' }}
          </h3>

          <form
            class="space-y-3"
            @submit.prevent="submitClass"
          >
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Name
              </label>
              <input
                v-model="formName"
                type="text"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                placeholder="Parfait"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Sort order
              </label>
              <input
                v-model.number="formSortOrder"
                type="number"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                placeholder="0"
              />
            </div>

            <p
              v-if="formError"
              class="text-xs text-red-600"
            >
              {{ formError }}
            </p>

            <div class="flex items-center gap-3">
              <button
                type="submit"
                class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-brand text-xs font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white disabled:opacity-60"
                :disabled="formSubmitting"
              >
                {{ editingId ? 'Save changes' : 'Add class' }}
              </button>
              <button
                v-if="editingId"
                type="button"
                class="text-xs text-gray-500 hover:text-gray-700"
                @click="resetForm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-semibold text-gray-900 tracking-tight">
            Products
          </h2>
          <p class="text-xs text-gray-600">
            Manage items under each product class, including name, description, and price.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-brand text-xs font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white"
          @click="refreshProducts"
        >
          Refresh
        </button>
      </div>

      <div class="space-y-4">
        <div class="flex flex-wrap items-center gap-3">
          <label class="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Product class
          </label>
          <select
            v-model.number="selectedClassId"
            class="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          >
            <option
              disabled
              value="0"
            >
              Select a class
            </option>
            <option
              v-for="cls in productClasses"
              :key="cls.id"
              :value="cls.id"
            >
              {{ cls.name }}
            </option>
          </select>
        </div>

        <div
          v-if="!selectedClassId"
          class="text-sm text-gray-500"
        >
          Choose a product class to see and edit its products.
        </div>

        <div
          v-else
          class="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]"
        >
          <div class="space-y-2">
            <div
              v-if="productsLoading"
              class="text-sm text-gray-500"
            >
              Loading products…
            </div>
            <div
              v-else-if="productsError"
              class="text-sm text-red-600"
            >
              {{ productsError }}
            </div>
            <ul
              v-else
              class="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-gray-50"
            >
              <li
                v-for="product in products"
                :key="product.id"
                class="px-3 py-2.5 flex items-center justify-between gap-3"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ product.name }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ formatPrice(product.price_cents) }} · Sort: {{ product.sort_order }}
                  </p>
                  <p
                    v-if="product.description"
                    class="text-xs text-gray-500 mt-0.5"
                  >
                    {{ product.description }}
                  </p>
                </div>
                <button
                  type="button"
                  class="text-xs font-medium text-brand hover:text-brand-light"
                  @click="startEditProduct(product)"
                >
                  Edit
                </button>
              </li>
              <li
                v-if="products.length === 0"
                class="px-3 py-4 text-sm text-gray-500 text-center"
              >
                No products yet for this class. Use the form to add one.
              </li>
            </ul>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-900">
              {{ editingProductId ? 'Edit product' : 'Add product' }}
            </h3>

            <form
              class="space-y-3"
              @submit.prevent="submitProduct"
            >
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Name
                </label>
                <input
                  v-model="productName"
                  type="text"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  placeholder="Parfait"
                />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  v-model="productDescription"
                  rows="2"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  placeholder="Optional description"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Price (₪)
                  </label>
                  <input
                    v-model.number="productPrice"
                    type="number"
                    min="0"
                    step="0.5"
                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    placeholder="0"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Sort order
                  </label>
                  <input
                    v-model.number="productSortOrder"
                    type="number"
                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    placeholder="0"
                  />
                </div>
              </div>

              <p
                v-if="productFormError"
                class="text-xs text-red-600"
              >
                {{ productFormError }}
              </p>

              <div class="flex items-center gap-3">
                <button
                  type="submit"
                  class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-brand text-xs font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white disabled:opacity-60"
                  :disabled="productSubmitting"
                >
                  {{ editingProductId ? 'Save product' : 'Add product' }}
                </button>
                <button
                  v-if="editingProductId"
                  type="button"
                  class="text-xs text-gray-500 hover:text-gray-700"
                  @click="resetProductForm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-semibold text-gray-900 tracking-tight">
            Customization options
          </h2>
          <p class="text-xs text-gray-600">
            Define options per product class (e.g. Toppings for Parfait, Sugar for Beverage).
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-brand text-xs font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white"
          @click="refreshCustomizations"
        >
          Refresh
        </button>
      </div>

      <div class="space-y-4">
        <div class="flex flex-wrap items-center gap-3">
          <label class="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Product class
          </label>
          <select
            v-model.number="selectedCustomizationClassId"
            class="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          >
            <option
              disabled
              value="0"
            >
              Select a class
            </option>
            <option
              v-for="cls in productClasses"
              :key="cls.id"
              :value="cls.id"
            >
              {{ cls.name }}
            </option>
          </select>
        </div>

        <div
          v-if="!selectedCustomizationClassId"
          class="text-sm text-gray-500"
        >
          Choose a product class to manage its customization groups.
        </div>

        <div
          v-else
          class="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]"
        >
          <div class="space-y-2">
            <div
              v-if="customizationsLoading"
              class="text-sm text-gray-500"
            >
              Loading…
            </div>
            <div
              v-else-if="customizationsError"
              class="text-sm text-red-600"
            >
              {{ customizationsError }}
            </div>
            <ul
              v-else
              class="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-gray-50"
            >
              <li
                v-for="opt in customizations"
                :key="opt.id"
                class="px-3 py-2.5 flex items-center justify-between gap-3"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ opt.label }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ opt.kind === 'multi' ? 'Multi' : 'Single' }}
                    <template v-if="opt.kind === 'multi'">
                      {{ opt.max_selections != null ? `(max ${opt.max_selections})` : '(no limit)' }}
                    </template>
                    · {{ (opt.options || []).length }} options
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="text-xs font-medium text-brand hover:text-brand-light"
                    @click="startEditCustomization(opt)"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    class="text-xs text-red-600 hover:text-red-700"
                    @click="deleteCustomization(opt.id)"
                  >
                    Delete
                  </button>
                </div>
              </li>
              <li
                v-if="customizations.length === 0"
                class="px-3 py-4 text-sm text-gray-500 text-center"
              >
                No customization groups yet. Add one with the form.
              </li>
            </ul>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-900">
              {{ editingCustomizationId ? 'Edit customization' : 'Add customization' }}
            </h3>

            <form
              class="space-y-3"
              @submit.prevent="submitCustomization"
            >
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Label
                </label>
                <input
                  v-model="customizationLabel"
                  type="text"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  placeholder="Toppings"
                />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Kind
                </label>
                <select
                  v-model="customizationKind"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                >
                  <option value="single">
                    Single
                  </option>
                  <option value="multi">
                    Multi
                  </option>
                </select>
              </div>

              <div
                v-if="customizationKind === 'multi'"
                class="space-y-1.5"
              >
                <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Max selections (optional)
                </label>
                <input
                  v-model.number="customizationMaxSelections"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  placeholder="No limit if empty"
                />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Options (one per line)
                </label>
                <textarea
                  v-model="customizationOptionsText"
                  rows="4"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  placeholder="Strawberries&#10;Granola&#10;Oreo"
                />
              </div>

              <p
                v-if="customizationFormError"
                class="text-xs text-red-600"
              >
                {{ customizationFormError }}
              </p>

              <div class="flex items-center gap-3">
                <button
                  type="submit"
                  class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-brand text-xs font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white disabled:opacity-60"
                  :disabled="customizationSubmitting"
                >
                  {{ editingCustomizationId ? 'Save' : 'Add' }}
                </button>
                <button
                  v-if="editingCustomizationId"
                  type="button"
                  class="text-xs text-gray-500 hover:text-gray-700"
                  @click="resetCustomizationForm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-semibold text-gray-900 tracking-tight">
            All orders (debug)
          </h2>
          <p class="text-xs text-gray-600">
            Paginated list of orders for debugging. Newest first.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <select
            v-model.number="ordersLimit"
            class="px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            @change="fetchOrders(1)"
          >
            <option :value="10">10 per page</option>
            <option :value="25">25 per page</option>
            <option :value="50">50 per page</option>
            <option :value="100">100 per page</option>
          </select>
          <button
            type="button"
            class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-brand text-xs font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white"
            @click="fetchOrders(ordersPage)"
          >
            Refresh
          </button>
        </div>
      </div>

      <div
        v-if="ordersLoading"
        class="text-sm text-gray-500"
      >
        Loading orders…
      </div>
      <div
        v-else-if="ordersError"
        class="text-sm text-red-600"
      >
        {{ ordersError }}
      </div>
      <div
        v-else
        class="space-y-4"
      >
        <div class="overflow-x-auto -mx-2">
          <table class="w-full min-w-[32rem] text-sm border-collapse">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-2 px-2 font-semibold text-gray-900">
                  #
                </th>
                <th class="text-left py-2 px-2 font-semibold text-gray-900">
                  Order #
                </th>
                <th class="text-left py-2 px-2 font-semibold text-gray-900">
                  Customer
                </th>
                <th class="text-left py-2 px-2 font-semibold text-gray-900">
                  Status
                </th>
                <th class="text-left py-2 px-2 font-semibold text-gray-900">
                  Created
                </th>
                <th class="text-left py-2 px-2 font-semibold text-gray-900">
                  Items
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="ord in ordersList"
                :key="ord.id"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-2 px-2 text-gray-600">
                  {{ ord.id }}
                </td>
                <td class="py-2 px-2 font-medium text-gray-900">
                  {{ ord.order_number ?? '—' }}
                </td>
                <td class="py-2 px-2 text-gray-900">
                  {{ ord.customer_name }}
                </td>
                <td class="py-2 px-2">
                  <span
                    class="inline-flex px-1.5 py-0.5 rounded text-xs font-medium"
                    :class="{
                      'bg-amber-100 text-amber-800': ord.status === 'new',
                      'bg-blue-100 text-blue-800': ord.status === 'preparing',
                      'bg-emerald-100 text-emerald-800': ord.status === 'ready',
                      'bg-gray-100 text-gray-700': ord.status === 'delivered' || ord.status === 'cancelled',
                    }"
                  >
                    {{ ord.status }}
                  </span>
                </td>
                <td class="py-2 px-2 text-gray-600">
                  {{ formatOrderDate(ord.created_at) }}
                </td>
                <td class="py-2 px-2 text-gray-700">
                  <ul class="list-disc list-inside space-y-0.5">
                    <li
                      v-for="(item, idx) in ord.items"
                      :key="idx"
                      class="text-xs"
                    >
                      {{ item.quantity }}× {{ item.product_name }}
                      <span
                        v-if="item.customizations_json"
                        class="text-gray-500"
                      >
                        ({{ formatCustomizations(item.customizations_json) }})
                      </span>
                    </li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p
          v-if="ordersList.length === 0"
          class="text-sm text-gray-500"
        >
          No orders yet.
        </p>
        <div
          v-else
          class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100"
        >
          <p class="text-xs text-gray-600">
            Showing {{ (ordersPage - 1) * ordersLimit + 1 }}–{{ Math.min(ordersPage * ordersLimit, ordersTotal) }} of {{ ordersTotal }}
          </p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-2 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
              :disabled="ordersPage <= 1"
              @click="fetchOrders(ordersPage - 1)"
            >
              Previous
            </button>
            <span class="text-sm text-gray-600">
              Page {{ ordersPage }} of {{ ordersTotalPages }}
            </span>
            <button
              type="button"
              class="px-2 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
              :disabled="ordersPage >= ordersTotalPages"
              @click="fetchOrders(ordersPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
declare const definePageMeta: (meta: any) => void

definePageMeta({
  layout: 'default',
})

const password = ref('')
const error = ref('')
const authenticated = ref(false)

const productClasses = ref<{ id: number; name: string; sort_order: number }[]>([])
const classesLoading = ref(false)
const classesError = ref('')

const formName = ref('')
const formSortOrder = ref<number | null>(0)
const formError = ref('')
const formSubmitting = ref(false)
const editingId = ref<number | null>(null)

const selectedClassId = ref<number | null>(null)
const products = ref<
  {
    id: number
    product_class_id: number
    name: string
    description: string | null
    price_cents: number
    sort_order: number
  }[]
>([])
const productsLoading = ref(false)
const productsError = ref('')

const productName = ref('')
const productDescription = ref('')
const productPrice = ref<number | null>(0)
const productSortOrder = ref<number | null>(0)
const productFormError = ref('')
const productSubmitting = ref(false)
const editingProductId = ref<number | null>(null)

const selectedCustomizationClassId = ref<number | null>(null)
const customizations = ref<
  {
    id: number
    product_class_id: number
    label: string
    kind: string
    options: string[]
    max_selections: number | null
  }[]
>([])
const customizationsLoading = ref(false)
const customizationsError = ref('')
const customizationLabel = ref('')
const customizationKind = ref<'single' | 'multi'>('multi')
const customizationMaxSelections = ref<number | null>(null)
const customizationOptionsText = ref('')
const customizationFormError = ref('')
const customizationSubmitting = ref(false)
const editingCustomizationId = ref<number | null>(null)

const ordersList = ref<
  {
    id: number
    order_number: number | null
    customer_name: string
    status: string
    created_at: string
    delivered_at: string | null
    items: Array<{ product_name: string; quantity: number; customizations_json: string | null }>
  }[]
>([])
const ordersTotal = ref(0)
const ordersPage = ref(1)
const ordersLimit = ref(25)
const ordersLoading = ref(false)
const ordersError = ref('')

const ordersTotalPages = computed(() =>
  Math.max(1, Math.ceil(ordersTotal.value / ordersLimit.value)),
)

function adminHeaders() {
  return {
    'x-admin-password': password.value,
  }
}

async function refreshClasses() {
  classesError.value = ''
  classesLoading.value = true
  try {
    const data = await $fetch<
      { id: number; name: string; sort_order: number }[]
    >('/api/admin/product-classes', {
      headers: adminHeaders(),
    })
    productClasses.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    classesError.value =
      e?.data?.message || e?.message || 'Failed to load product classes'
  } finally {
    classesLoading.value = false
  }
}

function startEdit(cls: { id: number; name: string; sort_order: number }) {
  editingId.value = cls.id
  formName.value = cls.name
  formSortOrder.value = cls.sort_order
  formError.value = ''
}

function resetForm() {
  editingId.value = null
  formName.value = ''
  formSortOrder.value = 0
  formError.value = ''
}

function resetProductForm() {
  editingProductId.value = null
  productName.value = ''
  productDescription.value = ''
  productPrice.value = 0
  productSortOrder.value = 0
  productFormError.value = ''
}

function formatPrice(priceCents: number) {
  const value = (priceCents || 0) / 100
  return `₪${value.toFixed(2)}`
}

async function refreshProducts() {
  productsError.value = ''
  if (!selectedClassId.value) {
    products.value = []
    return
  }
  productsLoading.value = true
  try {
    const data = await $fetch<
      {
        id: number
        product_class_id: number
        name: string
        description: string | null
        price_cents: number
        sort_order: number
      }[]
    >('/api/admin/products', {
      headers: adminHeaders(),
      query: { product_class_id: selectedClassId.value },
    })
    products.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    productsError.value =
      e?.data?.message || e?.message || 'Failed to load products'
  } finally {
    productsLoading.value = false
  }
}

function startEditProduct(product: {
  id: number
  product_class_id: number
  name: string
  description: string | null
  price_cents: number
  sort_order: number
}) {
  editingProductId.value = product.id
  selectedClassId.value = product.product_class_id
  productName.value = product.name
  productDescription.value = product.description || ''
  productPrice.value = product.price_cents / 100
  productSortOrder.value = product.sort_order
  productFormError.value = ''
}

async function submitProduct() {
  productFormError.value = ''
  productSubmitting.value = true
  try {
    if (!selectedClassId.value) {
      productFormError.value = 'Select a product class first'
      return
    }

    const name = productName.value.trim()
    if (!name) {
      productFormError.value = 'Name is required'
      return
    }

    const priceShekels =
      typeof productPrice.value === 'number' ? productPrice.value : 0
    const priceCents = Math.max(0, Math.round(priceShekels * 100))
    const sortOrder =
      typeof productSortOrder.value === 'number' ? productSortOrder.value : 0

    if (editingProductId.value) {
      await $fetch(`/api/admin/products/${editingProductId.value}`, {
        method: 'PATCH',
        headers: adminHeaders(),
        body: {
          name,
          description: productDescription.value,
          price_cents: priceCents,
          sort_order: sortOrder,
        },
      })
    } else {
      await $fetch('/api/admin/products', {
        method: 'POST',
        headers: adminHeaders(),
        body: {
          product_class_id: selectedClassId.value,
          name,
          description: productDescription.value,
          price_cents: priceCents,
          sort_order: sortOrder,
        },
      })
    }

    resetProductForm()
    await refreshProducts()
  } catch (e: any) {
    productFormError.value =
      e?.data?.message || e?.message || 'Failed to save product'
  } finally {
    productSubmitting.value = false
  }
}

async function fetchOrders(page: number) {
  ordersError.value = ''
  ordersLoading.value = true
  ordersPage.value = page
  try {
    const res = await $fetch<{
      orders: typeof ordersList.value
      total: number
      page: number
      limit: number
    }>('/api/admin/orders', {
      headers: adminHeaders(),
      query: { page, limit: ordersLimit.value },
    })
    ordersList.value = res.orders ?? []
    ordersTotal.value = res.total ?? 0
    ordersPage.value = res.page ?? page
  } catch (e: any) {
    ordersError.value =
      e?.data?.message || e?.message || 'Failed to load orders'
  } finally {
    ordersLoading.value = false
  }
}

function formatOrderDate(iso: string) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function formatCustomizations(json: string | null): string {
  if (!json) return ''
  try {
    const o = JSON.parse(json) as Record<string, string[]>
    return Object.entries(o)
      .map(([k, v]) => (Array.isArray(v) ? `${k}: ${v.join(', ')}` : ''))
      .filter(Boolean)
      .join('; ') || ''
  } catch {
    return ''
  }
}

async function refreshCustomizations() {
  customizationsError.value = ''
  if (!selectedCustomizationClassId.value) {
    customizations.value = []
    return
  }
  customizationsLoading.value = true
  try {
    const data = await $fetch<
      { id: number; product_class_id: number; label: string; kind: string; options: string[]; max_selections: number | null }[]
    >('/api/admin/customization-options', {
      headers: adminHeaders(),
      query: { product_class_id: selectedCustomizationClassId.value },
    })
    customizations.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    customizationsError.value =
      e?.data?.message || e?.message || 'Failed to load customizations'
  } finally {
    customizationsLoading.value = false
  }
}

function startEditCustomization(opt: {
  id: number
  product_class_id: number
  label: string
  kind: string
  options: string[]
  max_selections: number | null
}) {
  editingCustomizationId.value = opt.id
  selectedCustomizationClassId.value = opt.product_class_id
  customizationLabel.value = opt.label
  customizationKind.value = opt.kind === 'multi' ? 'multi' : 'single'
  customizationMaxSelections.value = opt.max_selections
  customizationOptionsText.value = (opt.options || []).join('\n')
  customizationFormError.value = ''
}

function resetCustomizationForm() {
  editingCustomizationId.value = null
  customizationLabel.value = ''
  customizationKind.value = 'multi'
  customizationMaxSelections.value = null
  customizationOptionsText.value = ''
  customizationFormError.value = ''
}

function parseOptionsText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

async function submitCustomization() {
  customizationFormError.value = ''
  customizationSubmitting.value = true
  try {
    if (!selectedCustomizationClassId.value) {
      customizationFormError.value = 'Select a product class first'
      return
    }
    const label = customizationLabel.value.trim()
    if (!label) {
      customizationFormError.value = 'Label is required'
      return
    }
    const options = parseOptionsText(customizationOptionsText.value)
    const maxSelections =
      customizationKind.value === 'multi' ? customizationMaxSelections.value : null

    if (editingCustomizationId.value) {
      await $fetch(`/api/admin/customization-options/${editingCustomizationId.value}`, {
        method: 'PATCH',
        headers: adminHeaders(),
        body: {
          label,
          kind: customizationKind.value,
          max_selections: maxSelections,
          options,
        },
      })
    } else {
      await $fetch('/api/admin/customization-options', {
        method: 'POST',
        headers: adminHeaders(),
        body: {
          product_class_id: selectedCustomizationClassId.value,
          label,
          kind: customizationKind.value,
          max_selections: maxSelections,
          options,
        },
      })
    }
    resetCustomizationForm()
    await refreshCustomizations()
  } catch (e: any) {
    customizationFormError.value =
      e?.data?.message || e?.message || 'Failed to save customization'
  } finally {
    customizationSubmitting.value = false
  }
}

async function deleteCustomization(id: number) {
  if (!confirm('Delete this customization group?')) return
  try {
    await $fetch(`/api/admin/customization-options/${id}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    })
    await refreshCustomizations()
    resetCustomizationForm()
  } catch (e: any) {
    customizationsError.value =
      e?.data?.message || e?.message || 'Failed to delete'
  }
}

async function submitClass() {
  formError.value = ''
  formSubmitting.value = true
  try {
    const name = formName.value.trim()
    if (!name) {
      formError.value = 'Name is required'
      return
    }
    const sortOrder =
      typeof formSortOrder.value === 'number' ? formSortOrder.value : 0

    if (editingId.value) {
      const updated = await $fetch<{
        id: number
        name: string
        sort_order: number
      }>(`/api/admin/product-classes/${editingId.value}`, {
        method: 'PATCH',
        headers: adminHeaders(),
        body: { name, sort_order: sortOrder },
      })
      const idx = productClasses.value.findIndex((c) => c.id === updated.id)
      if (idx !== -1) {
        productClasses.value.splice(idx, 1, updated)
      }
    } else {
      const created = await $fetch<{
        id: number
        name: string
        sort_order: number
      }>('/api/admin/product-classes', {
        method: 'POST',
        headers: adminHeaders(),
        body: { name, sort_order: sortOrder },
      })
      productClasses.value.push(created)
    }

    resetForm()
    await refreshClasses()
  } catch (e: any) {
    formError.value =
      e?.data?.message || e?.message || 'Failed to save product class'
  } finally {
    formSubmitting.value = false
  }
}

async function submitPassword() {
  error.value = ''
  const res = await $fetch<{ ok: boolean }>('/api/auth/check', {
    method: 'POST',
    body: { role: 'admin', password: password.value },
  })
  if (res.ok) {
    useAdminAuth().setAuthenticated()
    authenticated.value = true
    await refreshClasses()
    // Default to the first class for convenience; don't let products load failure block dashboard
    if (productClasses.value.length > 0) {
      selectedClassId.value = productClasses.value[0].id
      selectedCustomizationClassId.value = productClasses.value[0].id
      try {
        await refreshProducts()
      } catch {
        // Products list may be empty; dashboard still shows classes
      }
      try {
        await refreshCustomizations()
      } catch {
        // Customizations may be empty
      }
    }
    try {
      await fetchOrders(1)
    } catch {
      // Orders list may fail
    }
  } else {
    error.value = 'Incorrect password'
  }
}

watch(selectedCustomizationClassId, (id) => {
  if (id) refreshCustomizations()
  else customizations.value = []
})

// For now, always require the admin password on each page load
// so we can send it in headers for admin APIs.
</script>
